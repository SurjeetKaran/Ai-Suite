const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');
const log = require('../utils/logger');

// ---------------------------
// Verify normal user token
// ---------------------------
exports.verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      log('ERROR', 'User not found for token', { token });
      return res.status(401).json({ msg: 'User not found' });
    }
    log('INFO', `User verified: ${req.user.email}`);
    next();
  } catch (err) {
    log('ERROR', 'JWT verification failed for user', { error: err.message });
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

/**
 * Verify token for either Owner/Admin or Team Admin
 */
exports.verifyAdminOrTeamToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    log("WARN", "Authorization token missing");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --------------------------
    // Case 1: Owner/Admin
    // --------------------------
    if (decoded.email === process.env.ADMIN_EMAIL) {
      req.admin = { email: decoded.email };
      log("INFO", `Owner admin verified: ${decoded.email}`);
      return next();
    }

    // --------------------------
    // Case 2: Team Admin / Leader
    // --------------------------
    if (decoded.role === "teamAdmin" && decoded.teamId) {
      const team = await Team.findById(decoded.teamId);
      if (!team) {
        log("WARN", `Team not found for token: ${decoded.teamId}`);
        return res.status(404).json({ msg: "Team not found" });
      }
      req.team = team;
      log("INFO", `Team admin verified: ${team.email} for team ${team.name}`);
      return next();
    }

    // --------------------------
    // Unauthorized
    // --------------------------
    log("WARN", "Invalid token role or missing permissions");
    return res.status(403).json({ msg: "Unauthorized" });

  } catch (err) {
    log("ERROR", "Token verification failed", { error: err.message });
    return res.status(401).json({ msg: "Token is not valid" });
  }
};


