/**
 * index.js
 * ---------------------------------------------------
 * Application entry point
 *
 * - Loads environment variables (dotenv) as fallback
 * - Connects to MongoDB
 * - Loads dynamic SystemConfig into runtime memory
 * - Initializes cron jobs
 * - Starts Express server
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

// Passport (OAuth + JWT)
const passport = require("passport");
require("./config/passport");

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
   - Enables DB-based env variables
   - Avoids DB hits on every request
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
  }
}

/* =====================================================
   Middleware
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
app.use(passport.initialize());

/* =====================================================
   Routes
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
    // Resolve MongoDB URI dynamically
    // ------------------------------------------
    const MONGO_URI =
      process.env.MONGO_URI || null; // fallback only

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    log("INFO", "MongoDB connected successfully");

    // ------------------------------------------
    // Load SystemConfig AFTER DB connection
    // ------------------------------------------
    await loadDynamicEnv();

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
    process.exit(1); // hard fail if critical config missing
  }
}

// Boot application
startServer();

module.exports = { loadDynamicEnv };
