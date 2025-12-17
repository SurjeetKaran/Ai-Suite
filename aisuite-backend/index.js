/**
 * index.js
 * ---------------------------------------------------
 * Application entry point
 *
 * BOOT ORDER (IMPORTANT):
 * 1. Load .env (fallback only)
 * 2. Connect to MongoDB
 * 3. Load SystemConfig into global.SystemEnv
 * 4. Initialize Passport (OAuth + JWT)
 * 5. Start cron jobs
 * 6. Start Express server
 * ---------------------------------------------------
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Models
const SystemConfig = require("./models/SystemConfig");

// Global runtime config store (DB-backed)
global.SystemEnv = {};

// Cron jobs
const scheduleDailyQueryReset = require("./utils/resetDailyQueries");
const schedulePlanExpiryCheck = require("./utils/planExpiryCheck");
const scheduleAPIKeyReset = require("./utils/resetAPIKeyUsage");

// Utils
const log = require("./utils/logger");

// Routes
const authRoutes = require("./routes/auth");
const socialAuthRoutes = require("./routes/socialAuth");
const smartmixRoutes = require("./routes/smartmix");
const adminRoutes = require("./routes/admin");
const teamRoutes = require("./routes/team");
const apiKeyRoutes = require("./routes/apiKeys");

const app = express();

/* =====================================================
   Helper: Load SystemConfig into Runtime Memory
===================================================== */
async function loadDynamicEnv() {
  try {
    const configs = await SystemConfig.find();

    configs.forEach((cfg) => {
      global.SystemEnv[cfg.key] = cfg.value;
    });

    log("INFO", "Dynamic SystemConfig loaded", {
      keys: Object.keys(global.SystemEnv),
    });
  } catch (err) {
    log("ERROR", "Failed to load SystemConfig", {
      error: err.message,
    });
    throw err;
  }
}

/* =====================================================
   Middleware (SAFE BEFORE PASSPORT)
===================================================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://aisuite-orcin.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

/* =====================================================
   Routes (Passport-dependent routes will work
   because passport is initialized before server start)
===================================================== */
app.use("/auth", authRoutes);
app.use("/auth", socialAuthRoutes);
app.use("/apikeys", apiKeyRoutes);
app.use("/smartmix", smartmixRoutes);
app.use("/admin", adminRoutes);
app.use("/", teamRoutes);

/* =====================================================
   Database Connection + Server Bootstrap
===================================================== */
async function startServer() {
  try {
    // ------------------------------------------
    // Resolve MongoDB URI (env fallback only)
    // ------------------------------------------
    const MONGO_URI = process.env.MONGO_URI || null;

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(MONGO_URI);

    log("INFO", "MongoDB connected successfully");

    // ------------------------------------------
    // Load SystemConfig AFTER DB connection
    // ------------------------------------------
    await loadDynamicEnv();

    // ------------------------------------------
    // Initialize Passport AFTER SystemConfig
    // ------------------------------------------
    const passport = require("passport");
    require("./config/passport");
    app.use(passport.initialize());

    log("INFO", "Passport initialized with dynamic config");

    // ------------------------------------------
    // Start Cron Jobs
    // ------------------------------------------
    scheduleDailyQueryReset();
    schedulePlanExpiryCheck();
    scheduleAPIKeyReset();

    log("INFO", "Cron jobs started");

    // ------------------------------------------
    // Resolve PORT dynamically
    // ------------------------------------------
    const PORT =
      global.SystemEnv.PORT ||
      process.env.PORT ||
      5000;

    app.listen(PORT, "0.0.0.0", () => {
      log("INFO", `Server running on port ${PORT}`);
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    log("ERROR", "Server startup failed", {
      error: err.message,
    });
    process.exit(1);
  }
}

// Boot application
startServer();

module.exports = { loadDynamicEnv };
