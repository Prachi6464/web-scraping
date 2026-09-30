const puppeteer = require("puppeteer");
const Scrape = require("../models/Scrape");

// Helper: URL format validation
const isValidUrl = (str) => {
  try {
    const parsed = new URL(str);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// POST /api/scrape -> body: { url }
const scrapeUrl = async (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({
      message: "Please provide a valid URL including http:// or https://",
    });
  }

  // If user is authenticated -> permanent storage (expireAt: null)
  // If user is guest -> auto-delete after 1 hour (expireAt: now + 1hr)
  const isAuthUser = Boolean(req.user);
  const userId = isAuthUser ? req.user._id : null;
  const expireAt = isAuthUser ? null : new Date(Date.now() + 60 * 60 * 1000);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setDefaultNavigationTimeout(35000);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });

    // Extract page metadata, headings, links, and images
    const data = await page.evaluate(() => {
      const title = document.title || "";

      const metaDesc =
        document.querySelector('meta[name="description"]')?.content ||
        document.querySelector('meta[property="og:description"]')?.content ||
        document.querySelector('meta[name="twitter:description"]')?.content ||
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
    browser = null;

    // Deduplicate extracted links and images
    const uniqueLinks = [...new Set(data.links)];
    const uniqueImages = [...new Set(data.images)];

    const savedScrape = await Scrape.create({
      user: userId,
      url,
      title: data.title || "Untitled Page",
      description: data.metaDesc,
      headings: data.headings,
      links: uniqueLinks,
      images: uniqueImages,
      status: "success",
      expireAt,
    });

    return res.status(201).json(savedScrape);
  } catch (err) {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser instance:", closeErr.message);
      }
    }

    // Save failed attempt record for tracking
    const failedScrape = await Scrape.create({
      user: userId,
      url,
      status: "failed",
      errorMessage: err.message || "Failed to scrape the target URL.",
      expireAt,
    });

    return res.status(500).json({
      message: "Scraping failed. The website might be unreachable or blocking automated requests.",
      error: err.message,
      record: failedScrape,
    });
  }
};

// GET /api/scrape -> Retrieve scrapes
// If logged in: returns ONLY that user's scrapes
// If guest: returns active guest scrapes (auto-expires in 1h)
const getAllScrapes = async (req, res) => {
  try {
    // Proactively clean up any guest records that have exceeded their 1 hour TTL
    await Scrape.deleteMany({
      user: null,
      expireAt: { $ne: null, $lte: new Date() },
    });

    let query;
    if (req.user) {
      // Authenticated users see strictly their own saved scrapes
      query = { user: req.user._id };
    } else {
      // Guests see active unexpired guest scrapes
      query = {
        user: null,
        $or: [{ expireAt: null }, { expireAt: { $gt: new Date() } }],
      };
    }

    const scrapes = await Scrape.find(query).sort({ createdAt: -1 });
    return res.json(scrapes);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to retrieve scraping records.",
      error: err.message,
    });
  }
};

// GET /api/scrape/:id -> Get single scrape record
const getScrapeById = async (req, res) => {
  try {
    const scrape = await Scrape.findById(req.params.id);
    if (!scrape) {
      return res.status(404).json({ message: "Record not found." });
    }

    // If record belongs to a user, only allow that user to view it
    if (scrape.user && (!req.user || scrape.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: "Access denied to private user record." });
    }

    return res.json(scrape);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to retrieve record details.",
      error: err.message,
    });
  }
};

// DELETE /api/scrape/:id -> Delete record
const deleteScrape = async (req, res) => {
  try {
    const scrape = await Scrape.findById(req.params.id);
    if (!scrape) {
      return res.status(404).json({ message: "Record not found." });
    }

    // If user is authenticated, ensure the scrape belongs to them
    if (scrape.user) {
      if (!req.user || scrape.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You are not authorized to delete this record." });
      }
    }

    await Scrape.findByIdAndDelete(req.params.id);
    return res.json({ message: "Record deleted successfully.", id: req.params.id });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to delete record.",
      error: err.message,
    });
  }
};

module.exports = { scrapeUrl, getAllScrapes, getScrapeById, deleteScrape };
