const express = require("express");
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  getUserScrapes,
  deleteUser,
  getAllTasks,
  updateTask,
  deleteTask,
  rerunTask,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Enforce admin authorization on all routes
router.use(protect);
router.use(adminOnly);

// System overview stats
router.get("/stats", getAdminStats);

// User management & Master Data
router.get("/users", getAllUsers);
router.get("/users/:id/scrapes", getUserScrapes);
router.delete("/users/:id", deleteUser);

// Task management
router.get("/tasks", getAllTasks);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
router.post("/tasks/:id/rerun", rerunTask);

module.exports = router;
