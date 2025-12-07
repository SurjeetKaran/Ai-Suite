const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { verifyAdminOrTeamToken } = require("../middleware/authMiddleware");
const log = require("../utils/logger");

/* =====================================================================
 🧩 TEAM ROUTES
 Public → Anyone can register/login a team
 Protected → Owner/Admin or Team Leader (via verifyAdminOrTeamToken)
===================================================================== */

// =====================================================================
// 🌍 PUBLIC ROUTES
// =====================================================================

/**
 * @desc   Register a new team
 * @route  POST /team/register
 * @access Public
 */
router.post("/team/register", (req, res, next) => {
  log("INFO", `Public accessed route: POST /team/register`);
  next();
}, teamController.registerTeam);



// =====================================================================
// 🔐 PROTECTED ROUTES
// =====================================================================

// All routes below require a valid token — either Owner/Admin or Team Leader
router.use(verifyAdminOrTeamToken);


router.delete(
  "/team/self",
  (req, res, next) => {
    const user = req.admin ? `Owner/Admin ${req.admin.email}` : `Team Leader ${req.team.email}`;
    log("INFO", `${user} accessed route: DELETE /team/self`);
    next();
  },
  teamController.deleteTeam
);


/**
 * @desc   Add a new team member
 * @route  POST /team/member
 * @access Team Leader Only
 */
router.post("/team/member", (req, res, next) => {
  if (!req.team) {
    log("WARN", `Unauthorized member addition attempt`);
    return res.status(403).json({ msg: "Only Team Leader can add members" });
  }
  log("INFO", `Team Leader ${req.team.email} accessed route: POST /team/member`);
  next();
}, teamController.addTeamMember);


/**
 * @desc   Update an existing team member
 * @route  PATCH /team/member/:memberId
 * @access Team Leader Only
 */
router.patch("/team/member/:memberId", (req, res, next) => {
  if (!req.team) {
    log("WARN", `Unauthorized member update attempt`);
    return res.status(403).json({ msg: "Only Team Leader can update members" });
  }
  log("INFO", `Team Leader ${req.team.email} accessed route: PATCH /team/member/${req.params.memberId}`);
  next();
}, teamController.updateTeamMember);


/**
 * @desc   Remove a team member
 * @route  DELETE /team/member/:memberId
 * @access Team Leader Only
 */
router.delete("/team/member/:memberId", (req, res, next) => {
  if (!req.team) {
    log("WARN", `Unauthorized member removal attempt`);
    return res.status(403).json({ msg: "Only Team Leader can remove members" });
  }
  log("INFO", `Team Leader ${req.team.email} accessed route: DELETE /team/member/${req.params.memberId}`);
  next();
}, teamController.removeTeamMember);


/**
 * @desc   Get team dashboard stats
 * @route  GET /team/dashboard
 * @access Admin/Owner or Team Leader
 * @note   Admin must pass ?teamId=<team_id> in query to view any team’s dashboard
 */
router.get("/team/dashboard", (req, res, next) => {
  const user = req.admin ? `Owner/Admin ${req.admin.email}` : `Team Leader ${req.team.email}`;
  log("INFO", `${user} accessed route: GET /team/dashboard`);
  next();
}, teamController.getTeamDashboardStats);


module.exports = router;
