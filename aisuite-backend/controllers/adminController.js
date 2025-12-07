

const User = require("../models/User");
const QueryHistory = require("../models/QueryHistory");
const log = require("../utils/logger");
const Plan = require("../models/Plan");
const Team = require("../models/Team");

// ❌ REMOVED: loginAdmin (Now handled by authController.js)

/**
 * @desc   Get complete admin dashboard data including all users, teams, module usage, and recent queries
 * @route  GET /api/admin/dashboard
 * @access Admin
 */
exports.getAdminDashboard = async (req, res) => {
  try {
    log("INFO", `Admin ${req.admin.email} requested complete dashboard data`);

    // ---------------------------
    // 1️⃣ User Stats
    // ---------------------------
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ subscription: "Pro" });

    // ---------------------------
    // 2️⃣ Dynamic Revenue Calculation
    // ---------------------------
    const planPrice = 299;

    // Parse query params for dynamic range (from date picker)
    const now = new Date();
    // Default start to epoch 0 if not provided, to capture all history
    const start = req.query.start ? new Date(req.query.start) : new Date(0); 
    const end = req.query.end ? new Date(req.query.end) : now;
    end.setHours(23, 59, 59, 999); 

    // Total revenue in range
    const revenueProUsers = await User.countDocuments({
      subscription: "Pro",
      subscribedAt: { $gte: start, $lte: end }
    });

    const totalRevenue = revenueProUsers * planPrice;

    // Daily revenue chart for the selected range
    const chartDataRaw = await User.aggregate([
      {
        $match: {
          subscription: "Pro",
          subscribedAt: { $gte: start, $lte: end, $ne: null } // Ensure valid date
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$subscribedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenueChart = chartDataRaw.map(r => ({
      date: r._id,
      revenue: r.count * planPrice
    }));

    // ---------------------------
    // 3️⃣ Fetch Users List
    // ---------------------------
    const usersList = await User.find().sort({ createdAt: -1 });

    // ---------------------------
    // 4️⃣ Module Usage Stats
    // ---------------------------
    // FIX: Group by 'moduleType' instead of 'type'
    const moduleStatsRaw = await QueryHistory.aggregate([
      { $group: { _id: "$moduleType", count: { $sum: 1 } } },
    ]);
    
    // Map null _id to "General" for cleaner charts
    const moduleStats = moduleStatsRaw.map(m => ({
        _id: m._id || "General", 
        count: m.count
    }));

    // ---------------------------
    // 5️⃣ Recent Query Logs
    // ---------------------------
    // FIX: Sort by 'lastUpdated', limit to 50
    const recentQueries = await QueryHistory.find()
      .populate("userId", "name email subscription")
      .sort({ lastUpdated: -1 }) 
      .limit(50);

    // ---------------------------
    // 6️⃣ Total Queries
    // ---------------------------
    const totalQueries = await QueryHistory.countDocuments();

    // ---------------------------
    // 7️⃣ Teams Stats
    // ---------------------------
    const teams = await Team.find().sort({ createdAt: -1 });
    const totalTeams = teams.length;

    const teamsList = await Promise.all(
      teams.map(async (team) => {
        const totalMembers = team.members.length;
        const freeMembers = team.members.filter((m) => m.subscription === "Free").length;
        const proMembers = team.members.filter((m) => m.subscription === "Pro").length;

        // Approximate team usage calculation
        // (This assumes userId on QueryHistory matches a team member ID)
        const usageStats = await QueryHistory.aggregate([
           { $match: { userId: { $in: team.members.map(m => m._id) } } },
           { $group: { _id: null, count: { $sum: 1 } } }, // Sum all queries for these users
        ]);

        const totalTeamQueries = usageStats.length > 0 ? usageStats[0].count : 0;

        return {
          id: team._id,
          name: team.name,
          email: team.email,
          totalMembers,
          freeMembers,
          proMembers,
          totalTeamQueries,
        };
      })
    );

    // ---------------------------
    // 8️⃣ Final Dashboard Response
    // ---------------------------
    const dashboardData = {
      userStats: {
        totalUsers,
        proUsers,
        totalRevenue,
        totalQueries,
        totalTeams,
      },
      revenueChart, 
      usersList,
      moduleStats,
      recentQueries,
      teamsList,
    };

    log("INFO", "Admin dashboard data compiled successfully");
    res.json(dashboardData);

  } catch (error) {
    log("ERROR", "Failed to fetch complete admin dashboard data", { error });
    res.status(500).json({ msg: "Failed to fetch dashboard data" });
  }
};

/**
 * @desc   Update a user's subscription plan (Free / Pro)
 * @route  PATCH /api/admin/user/:id
 * @access Admin
 */
exports.updateUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;

    log(
      "INFO",
      `Admin ${req.admin.email} is updating subscription for user ID: ${id} to ${subscription}`
    );

    const updateFields = { subscription };

    if (subscription === "Pro") {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + 30);

      updateFields.subscribedAt = now;
      updateFields.expiryDate = expiry;
    } else if (subscription === "Free") {
      updateFields.subscribedAt = null;
      updateFields.expiryDate = null;
      // Optional: Reset daily count if you want them to start fresh on Free limits
      // updateFields.dailyQueryCount = 0; 
    }

    const user = await User.findByIdAndUpdate(id, updateFields, { new: true });

    if (!user) {
      log("WARN", `Attempted to update non-existent user ID: ${id}`);
      return res.status(404).json({ msg: "User not found" });
    }

    log(
      "INFO",
      `User ${user.email} subscription updated to ${user.subscription} by admin ${req.admin.email}`
    );

    res.json({
      msg: `User subscription updated to ${user.subscription}`,
      user,
    });
  } catch (error) {
    log("ERROR", "Failed to update user subscription", { error });
    res.status(500).json({ msg: "Failed to update user subscription" });
  }
};

/**
 * @desc   Create a new subscription plan
 * @route  POST /admin/plan
 * @access Admin
 */
exports.createPlan = async (req, res) => {
  try {
    const { name, price, dailyQueryLimit, features } = req.body;

    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      log("WARN", `Attempt to create duplicate plan: ${name}`);
      return res.status(400).json({ msg: "Plan already exists" });
    }

    const plan = new Plan({ name, price, dailyQueryLimit, features });
    await plan.save();

    log("INFO", `New plan created: ${name} by admin ${req.admin.email}`);
    res.status(201).json(plan);
  } catch (error) {
    log("ERROR", "Failed to create plan", { error });
    res.status(500).json({ msg: "Failed to create plan" });
  }
};

/**
 * @desc   Delete a subscription plan
 * @route  DELETE /admin/plan/:id
 * @access Admin
 */
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
      log("WARN", `Attempt to delete non-existent plan ID: ${id}`);
      return res.status(404).json({ msg: "Plan not found" });
    }

    log("INFO", `Plan deleted: ${plan.name} by admin ${req.admin.email}`);
    res.json({ msg: "Plan deleted successfully" });
  } catch (error) {
    log("ERROR", "Failed to delete plan", { error });
    res.status(500).json({ msg: "Failed to delete plan" });
  }
};

/**
 * @desc   Fetch all subscription plans
 * @route  GET /admin/plan
 * @access Admin
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });

    if (req.admin) {
      log("INFO", `Admin ${req.admin.email} fetched all plans`);
    } else {
      log("INFO", `Public user accessed plans`);
    }

    res.json(plans);
  } catch (error) {
    log("ERROR", "Failed to fetch plans", { error });
    res.status(500).json({ msg: "Failed to fetch plans" });
  }
};

/**
 * @desc   Update a subscription plan
 * @route  PATCH /admin/plan/:id
 * @access Admin
 */
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, dailyQueryLimit, features } = req.body;

    log("INFO", `Admin ${req.admin.email} is updating plan ID: ${id}`);

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { name, price, dailyQueryLimit, features },
      { new: true }
    );

    if (!updatedPlan) {
      log("WARN", `Attempted to update non-existent plan ID: ${id}`);
      return res.status(404).json({ msg: "Plan not found" });
    }

    log(
      "INFO",
      `Plan updated: ${updatedPlan.name} by admin ${req.admin.email}`
    );

    res.json(updatedPlan);
  } catch (error) {
    log("ERROR", "Failed to update plan", { error });
    res.status(500).json({ msg: "Failed to update plan" });
  }
};