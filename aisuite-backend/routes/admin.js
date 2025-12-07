const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyAdminOrTeamToken } = require("../middleware/authMiddleware");
const log = require("../utils/logger");

// ---------------------------
// Admin-only guard middleware
// ---------------------------
const adminOnly = (req, res, next) => {
  if (!req.admin) {
    log("WARN", "Unauthorized access attempt to admin route");
    return res.status(403).json({ msg: "Admin access only" });
  }
  next();
};

// ---------------------------
// Public Routes
// ---------------------------

// Fetch all subscription plans (Public access)
router.get("/plan", (req, res, next) => {
  log("INFO", "Public route accessed: GET /plan");
  next();
}, adminController.getPlans);

// ---------------------------
// Admin Protected Routes
// ---------------------------

// Dashboard: users, queries, module stats, recent logs, teams
router.get("/dashboard", verifyAdminOrTeamToken, adminOnly, (req, res, next) => {
  log("INFO", `Admin route accessed: GET /dashboard by ${req.admin.email}`);
  next();
}, adminController.getAdminDashboard);

// Update a user's subscription plan
router.patch("/user/:id", verifyAdminOrTeamToken, adminOnly, (req, res, next) => {
  log("INFO", `Admin route accessed: PATCH /user/${req.params.id} by ${req.admin.email}`);
  next();
}, adminController.updateUserPlan);

// ---------------------------
// Plan Management (Admin Only)
// ---------------------------

// Create a new subscription plan
router.post("/plan", verifyAdminOrTeamToken, adminOnly, (req, res, next) => {
  log("INFO", `Admin route accessed: POST /plan by ${req.admin.email}`);
  next();
}, adminController.createPlan);

// Delete a subscription plan by ID
router.delete("/plan/:id", verifyAdminOrTeamToken, adminOnly, (req, res, next) => {
  log("INFO", `Admin route accessed: DELETE /plan/${req.params.id} by ${req.admin.email}`);
  next();
}, adminController.deletePlan);

// Update a subscription plan by ID
router.patch("/plan/:id", verifyAdminOrTeamToken, adminOnly, (req, res, next) => {
  log("INFO", `Admin route accessed: PATCH /plan/${req.params.id} by ${req.admin.email}`);
  next();
}, adminController.updatePlan);

module.exports = router;




