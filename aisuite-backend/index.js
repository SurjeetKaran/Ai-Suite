require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const scheduleDailyQueryReset = require("./utils/resetDailyQueries");
const schedulePlanExpiryCheck = require("./utils/planExpiryCheck");
const log = require("./utils/logger"); // import logger

// Routes
const authRoutes = require('./routes/auth');
const smartmixRoutes = require('./routes/smartmix');
const adminRoutes = require('./routes/admin'); // new admin routes
const teamRoutes = require('./routes/team')

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://aisuite-orcin.vercel.app"
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));


app.use(express.json());

// ---------------------------
// API Routes
// ---------------------------
app.use('/auth', authRoutes);
app.use('/smartmix', smartmixRoutes);
app.use('/admin', adminRoutes); // register admin routes
app.use('/', teamRoutes);

// ---------------------------
// Connect to MongoDB
// ---------------------------
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    log("INFO", "MongoDB connected successfully");

    // Start cron jobs after DB is ready
    scheduleDailyQueryReset();     // resets Free users' dailyQueryCount
    schedulePlanExpiryCheck();     // downgrades expired Pro users
})
.catch(err => log("ERROR", "MongoDB connection failed", { error: err }))

// ---------------------------
// Start Server
// ---------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => log("INFO", `Server running on port ${PORT}`));


