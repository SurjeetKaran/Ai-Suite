

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');

// const scheduleDailyQueryReset = require("./utils/resetDailyQueries");
// const schedulePlanExpiryCheck = require("./utils/planExpiryCheck");
// const scheduleAPIKeyReset = require("./utils/resetAPIKeyUsage"); // NEW CRON JOB

// const log = require("./utils/logger");

// // NEW → Passport & Social Routes
// const passport = require("passport");
// require("./config/passport"); 
// const socialAuthRoutes = require("./routes/socialAuth");

// // Routes
// const authRoutes = require('./routes/auth');
// const smartmixRoutes = require('./routes/smartmix');
// const adminRoutes = require('./routes/admin');
// const teamRoutes = require('./routes/team');
// const ApiKeyRoutes = require('./routes/apikeys');

// const app = express();

// // ---------------------------
// // CORS Setup
// // ---------------------------
// app.use(cors({
//     origin: [
//         "http://localhost:5173",
//         "https://aisuite-orcin.vercel.app"
//     ],
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     credentials: true
// }));

// app.use(express.json());

// // ---------------------------
// // Initialize Passport
// // ---------------------------
// app.use(passport.initialize());

// // ---------------------------
// // API Routes
// // ---------------------------
// app.use('/auth', authRoutes);      
// app.use('/auth', socialAuthRoutes); 
// app.use('/apikeys', ApiKeyRoutes); // NEW: API Key management routes

// app.use('/smartmix', smartmixRoutes);

// // Admin routes now also include LB and API key management
// app.use('/admin', adminRoutes);

// // Team routes
// app.use('/', teamRoutes);

// // ---------------------------
// // Connect to MongoDB
// // ---------------------------
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
// .then(() => {
//     log("INFO", "MongoDB connected successfully");

//     // CRON JOBS START AFTER DB CONNECTS
//     scheduleDailyQueryReset();
//     schedulePlanExpiryCheck();
//     scheduleAPIKeyReset(); // NEW: Reset API key usage daily

//     log("INFO", "All cron jobs started");
// })
// .catch(err => log("ERROR", "MongoDB connection failed", { error: err }));

// // ---------------------------
// // Start Server
// // ---------------------------
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   log("INFO", `Server running on port ${PORT}`);
// });
// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const SystemConfig = require("./models/SystemConfig");
global.SystemEnv = {}; // dynamic config memory store

const scheduleDailyQueryReset = require("./utils/resetDailyQueries");
const schedulePlanExpiryCheck = require("./utils/planExpiryCheck");
const scheduleAPIKeyReset = require("./utils/resetAPIKeyUsage");

const log = require("./utils/logger");

// Passport
const passport = require("passport");
require("./config/passport");

// Routes
const authRoutes = require("./routes/auth");
const socialAuthRoutes = require("./routes/socialAuth");
const smartmixRoutes = require("./routes/smartmix");
const adminRoutes = require("./routes/admin");
const teamRoutes = require("./routes/team");
const ApiKeyRoutes = require("./routes/apikeys");

const app = express();

/* =========================
    Load Dynamic System Config
============================ */
async function loadDynamicEnv() {
  try {
    const configs = await SystemConfig.find();
    configs.forEach(cfg => {
      global.SystemEnv[cfg.key] = cfg.value;
    });

    log("INFO", "Dynamic Config Loaded", { keys: Object.keys(global.SystemEnv) });
  } catch (err) {
    log("ERROR", "Dynamic config load failed", { error: err.message });
  }
}

app.use(cors({
  origin: ["http://localhost:5173", "https://aisuite-orcin.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/auth", socialAuthRoutes);
app.use("/apikeys", ApiKeyRoutes);
app.use("/smartmix", smartmixRoutes);
app.use("/admin", adminRoutes);
app.use("/", teamRoutes);

/* =========================
    CONNECT MONGO + START SERVER
============================ */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  log("INFO", "MongoDB connected successfully");

  await loadDynamicEnv();

  scheduleDailyQueryReset();
  schedulePlanExpiryCheck();
  scheduleAPIKeyReset();

  log("INFO", "Cron jobs started");
})
.catch(err => log("ERROR", "MongoDB connection failed", { error: err }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  log("INFO", `Server running on port ${PORT}`);
});

module.exports = { loadDynamicEnv };
