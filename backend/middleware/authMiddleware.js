const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "webscraper_college_project_secret_key_2026";

// Require authentication
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found with this token." });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized. Invalid or expired token." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized. No token provided." });
  }
};

// Optional authentication (allows guests or attaches logged in user if token present)
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      req.user = null;
    }
  }
  next();
};

// Restrict to Administrators only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    message: "Access denied. Administrator privileges required.",
  });
};

module.exports = { protect, optionalAuth, adminOnly, JWT_SECRET };
