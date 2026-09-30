const mongoose = require("mongoose");

const scrapeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    headings: {
      type: [String],
      default: [],
    },
    links: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending", "in-progress", "cancelled"],
      default: "success",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    expireAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// MongoDB TTL index: documents expire when current time reaches expireAt
scrapeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Scrape", scrapeSchema);
