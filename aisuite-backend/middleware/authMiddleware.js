const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Team = require("../models/Team");
const log = require("../utils/logger");

/**
 * Helper: resolve JWT secret dynamically
 */
function getJwtSecret() {
  return (
    global.SystemEnv?.JWT_SECRET ||
    process.env.JWT_SECRET
  );
}

/**
 * Helper: resolve Admin email dynamically
 */
function getAdminEmail() {
  return (
    global.SystemEnv?.ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL
  );
}

/* =====================================================
   VERIFY NORMAL USER TOKEN
===================================================== */
exports.verifyToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    log("WARN", "Missing authorization token");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const JWT_SECRET = getJwtSecret();
  if (!JWT_SECRET) {
    log("ERROR", "JWT_SECRET not configured");
    return res.status(500).json({ msg: "Auth configuration error" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Normal users must have an id
    if (!decoded.id) {
      return res.status(401).json({ msg: "Invalid user token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      log("ERROR", "User not found for token", { token });
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = user;
    log("INFO", `User verified: ${user.email}`);
    next();

  } catch (err) {
    log("ERROR", "JWT verification failed for user", {
      error: err.message,
    });
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

/* =====================================================
   VERIFY ADMIN (OWNER) OR TEAM ADMIN
===================================================== */
exports.verifyAdminOrTeamToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    log("WARN", "Authorization token missing");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  const JWT_SECRET = getJwtSecret();
  const ADMIN_EMAIL = getAdminEmail();

  if (!JWT_SECRET) {
    log("ERROR", "JWT_SECRET not configured");
    return res.status(500).json({ msg: "Auth configuration error" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    /* --------------------------
       CASE 1: SUPER ADMIN
    -------------------------- */
    if (ADMIN_EMAIL && decoded.email === ADMIN_EMAIL) {
      req.admin = { email: decoded.email };
      log("INFO", `Super admin verified: ${decoded.email}`);
      return next();
    }

    /* --------------------------
       CASE 2: TEAM ADMIN
    -------------------------- */
    if (decoded.role === "teamAdmin" && decoded.teamId) {
      const team = await Team.findById(decoded.teamId);

      if (!team) {
        log("WARN", `Team not found for token: ${decoded.teamId}`);
        return res.status(404).json({ msg: "Team not found" });
      }

      req.team = team;
      log(
        "INFO",
        `Team admin verified: ${team.email} for team ${team.name}`
      );
      return next();
    }

    log("WARN", "Unauthorized - Invalid admin or team token");
    return res.status(403).json({ msg: "Unauthorized" });

  } catch (err) {
    log("ERROR", "Token verification failed", {
      error: err.message,
    });
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

/* =====================================================
   VERIFY OWNER ADMIN ONLY (STRICT)
===================================================== */
exports.verifyOwnerAdminOnly = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    log("WARN", "Missing token for owner admin-only route");
    return res.status(401).json({ msg: "No token provided" });
  }

  const JWT_SECRET = getJwtSecret();
  const ADMIN_EMAIL = getAdminEmail();

  if (!JWT_SECRET || !ADMIN_EMAIL) {
    log("ERROR", "Owner admin auth not configured properly");
    return res.status(500).json({ msg: "Auth configuration error" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.email !== ADMIN_EMAIL) {
      log("WARN", "Unauthorized access attempt to owner-admin-only route", {
        attemptedBy: decoded.email,
      });
      return res
        .status(403)
        .json({ msg: "Only the system owner can access this route" });
    }

    req.admin = { email: decoded.email };
    log("INFO", `Owner-admin verified: ${decoded.email}`);
    next();

  } catch (err) {
    log("ERROR", "Owner admin token verification failed", {
      error: err.message,
    });
    return res.status(401).json({ msg: "Token is not valid" });
  }
};




