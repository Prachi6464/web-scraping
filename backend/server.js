require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const scrapeRoutes = require("./routes/scrape");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/webscraperDB";

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/scrape", scrapeRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "MERN Web Scraper API",
    version: "2.1.0",
    endpoints: {
      auth: "/api/auth",
      scrape: "/api/scrape",
      admin: "/api/admin",
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({ message: "Internal server error occurred", error: err.message });
});

// Seed default administrator account if not present
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@college.edu";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!existingAdmin) {
      await User.create({
        name: "System Administrator",
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: "admin",
      });
      console.log(`Default Administrator created: ${adminEmail} (password: ${adminPassword})`);
    } else if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log(`Account ${adminEmail} upgraded to Administrator role.`);
    } else {
      console.log(`Administrator account verified: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Error seeding administrator account:", error.message);
  }
};

// Database connection & Server initialization
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully");
    await seedAdmin();
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
