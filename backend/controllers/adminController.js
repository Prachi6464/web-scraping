const puppeteer = require("puppeteer");
const User = require("../models/User");
const Scrape = require("../models/Scrape");

// @desc    Get aggregate platform metrics for Admin
// @route   GET /api/admin/stats
// @access  Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await Scrape.countDocuments();
    const successfulTasks = await Scrape.countDocuments({ status: "success" });
    const failedTasks = await Scrape.countDocuments({ status: "failed" });
    const activeGuestTasks = await Scrape.countDocuments({ user: null });

    return res.json({
      totalUsers,
      totalTasks,
      successfulTasks,
      failedTasks,
      activeGuestTasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load admin statistics.",
      error: error.message,
    });
  }
};

// @desc    Get all registered users with detailed master scraping numbers
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // Aggregate comprehensive scraping numbers for each user
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const userScrapes = await Scrape.find({ user: u._id })
          .select("status links images createdAt")
          .sort({ createdAt: -1 });

        const totalScrapes = userScrapes.length;
        const successfulScrapes = userScrapes.filter((s) => s.status === "success").length;
        const failedScrapes = userScrapes.filter((s) => s.status === "failed").length;
        const totalLinks = userScrapes.reduce(
          (acc, curr) => acc + (curr.links ? curr.links.length : 0),
          0
        );
        const totalImages = userScrapes.reduce(
          (acc, curr) => acc + (curr.images ? curr.images.length : 0),
          0
        );
        const lastScrapedAt = userScrapes.length > 0 ? userScrapes[0].createdAt : null;

        return {
          ...u.toObject(),
          taskCount: totalScrapes,
          totalScrapes,
          successfulScrapes,
          failedScrapes,
          totalLinks,
          totalImages,
          lastScrapedAt,
        };
      })
    );

    return res.json(usersWithCounts);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve user accounts.",
      error: error.message,
    });
  }
};

// @desc    Get all scrapes for a specific user (Drill-down Master Data)
// @route   GET /api/admin/users/:id/scrapes
// @access  Admin
const getUserScrapes = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    const scrapes = await Scrape.find({ user: req.params.id }).sort({ createdAt: -1 });
    return res.json({ user, scrapes });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve user scrapes.",
      error: error.message,
    });
  }
};

// @desc    Delete a user account and their tasks
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    if (user.email === "admin@college.edu" || user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete the active primary administrator account." });
    }

    // Cascade delete user's scrapes
    await Scrape.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);

    return res.json({ message: "User and all associated scrape tasks deleted successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete user.",
      error: error.message,
    });
  }
};

// @desc    Get all tasks across the system with user details
// @route   GET /api/admin/tasks
// @access  Admin
const getAllTasks = async (req, res) => {
  try {
    const { status, q } = req.query;
    let filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { url: { $regex: q, $options: "i" } },
        { notes: { $regex: q, $options: "i" } },
      ];
    }

    const tasks = await Scrape.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve tasks.",
      error: error.message,
    });
  }
};

// @desc    Update a task (title, status, notes, priority)
// @route   PUT /api/admin/tasks/:id
// @access  Admin
const updateTask = async (req, res) => {
  try {
    const { title, status, notes, priority } = req.body;
    const task = await Scrape.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (title !== undefined) task.title = title;
    if (status !== undefined) task.status = status;
    if (notes !== undefined) task.notes = notes;
    if (priority !== undefined) task.priority = priority;

    const updatedTask = await task.save();
    const populated = await Scrape.findById(updatedTask._id).populate("user", "name email role");

    return res.json({
      message: "Task updated successfully.",
      task: populated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update task.",
      error: error.message,
    });
  }
};

// @desc    Delete any task
// @route   DELETE /api/admin/tasks/:id
// @access  Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Scrape.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }
    return res.json({ message: "Task deleted successfully.", id: req.params.id });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete task.",
      error: error.message,
    });
  }
};

// @desc    Re-run scraping task with Puppeteer
// @route   POST /api/admin/tasks/:id/rerun
// @access  Admin
const rerunTask = async (req, res) => {
  const task = await Scrape.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  task.status = "in-progress";
  await task.save();

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setDefaultNavigationTimeout(35000);
    await page.goto(task.url, { waitUntil: "domcontentloaded", timeout: 35000 });

    const data = await page.evaluate(() => {
      const title = document.title || "";
      const metaDesc =
        document.querySelector('meta[name="description"]')?.content ||
        document.querySelector('meta[property="og:description"]')?.content ||
        "";
      const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((el) => el.innerText.trim())
        .filter(Boolean)
        .slice(0, 60);
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => a.href)
        .filter((href) => href.startsWith("http"))
        .slice(0, 100);
      const images = Array.from(document.querySelectorAll("img[src]"))
        .map((img) => img.src)
        .filter((src) => src.startsWith("http"))
        .slice(0, 60);

      return { title, metaDesc, headings, links, images };
    });

    await browser.close();

    task.title = data.title || task.title;
    task.description = data.metaDesc;
    task.headings = data.headings;
    task.links = [...new Set(data.links)];
    task.images = [...new Set(data.images)];
    task.status = "success";
    task.errorMessage = "";

    await task.save();
    const populated = await Scrape.findById(task._id).populate("user", "name email role");

    return res.json({ message: "Task re-crawled successfully.", task: populated });
  } catch (err) {
    if (browser) await browser.close();
    task.status = "failed";
    task.errorMessage = err.message || "Re-scrape execution failed.";
    await task.save();
    return res.status(500).json({ message: "Task re-scrape failed.", error: err.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  getUserScrapes,
  deleteUser,
  getAllTasks,
  updateTask,
  deleteTask,
  rerunTask,
};
