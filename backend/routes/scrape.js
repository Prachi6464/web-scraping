const express = require("express");
const router = express.Router();
const {
  scrapeUrl,
  getAllScrapes,
  getScrapeById,
  deleteScrape,
} = require("../controllers/scrapeController");
const { optionalAuth } = require("../middleware/authMiddleware");

// Scrape routes with optional authentication
router.post("/", optionalAuth, scrapeUrl);
router.get("/", optionalAuth, getAllScrapes);
router.get("/:id", optionalAuth, getScrapeById);
router.delete("/:id", optionalAuth, deleteScrape);

module.exports = router;
