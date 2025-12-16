

const Team = require("../models/Team");
const User = require("../models/User"); // 🆕 Import User Model
const log = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QueryHistory = require("../models/QueryHistory");
const adminController = require("./adminController"); // ensure imported

/* ----------------------------------------------------------------
 🧩 TEAM CONTROLLER
 Handles team registration, member management & dashboard.
 Login is now handled by authController.
------------------------------------------------------------------ */

// ================================================================
// 🌍 PUBLIC ROUTES
// ================================================================

/**
 * @desc   Register a new team (Public)
 * @route  POST /team/register
 * @access Public
 */
exports.registerTeam = async (req, res) => {
  try {
    const { name, description, email, password } = req.body;

    // Check for existing team with same email
    const existingTeam = await Team.findOne({ email });
    if (existingTeam) {
      log("WARN", `Duplicate team registration attempt: ${email}`);
      return res.status(400).json({ msg: "Team email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const team = new Team({
      name,
      description,
      email,
      password: hashedPassword,
      subscription: "Pro",
      members: [],
    });

    await team.save();

    log("INFO", `✅ New team registered successfully: ${name}`);
    res.status(201).json({ msg: "Team registered successfully", team });
  } catch (error) {
    log("ERROR", "Failed to register team", { error });
    res.status(500).json({ msg: "Failed to register team" });
  }
};

// ================================================================
// 👥 TEAM MEMBER MANAGEMENT (Team Leader Only)
// ================================================================

exports.addTeamMember = async (req, res) => {
  try {
    const { name, email, password, subscription } = req.body;
    const team = req.team;

    // 1. Check if member is already in THIS team
    if (team.members.some((m) => m.email === email)) {
      log("WARN", `Duplicate member email in team: ${email}`);
      return res.status(400).json({ msg: "Member email already exists in team" });
    }

    // 2. Check Global User Collection
    let user = await User.findOne({ email });
    let userId;
    let finalPasswordHash;

    // 3. Create or Update User
    if (user) {
      // User exists: Just link them and update subscription
      log('INFO', `Linking existing user ${email} to team ${team.name}`);
      user.subscription = subscription; // Upgrade/Downgrade to match team assignment
      
      // NOTE: We do NOT change their password if they already exist
      finalPasswordHash = user.password; 
      userId = user._id;
      
      // Set dates if Pro
      if (subscription === "Pro") {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setDate(now.getDate() + 30);
        user.subscribedAt = now;
        user.expiryDate = expiry;
      }
      await user.save();
      
    } else {
      // User does NOT exist: Create new account
      log('INFO', `Creating new user account for team member ${email}`);
      finalPasswordHash = await bcrypt.hash(password, 10);
      
      user = new User({
        name,
        email,
        password: finalPasswordHash,
        subscription
      });

      if (subscription === "Pro") {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setDate(now.getDate() + 30);
        user.subscribedAt = now;
        user.expiryDate = expiry;
      }

      await user.save();
      userId = user._id;
    }

    // 4. Add to Team Array (Include userId link)
    const newMember = { 
        userId, // 🔗 Link established!
        name, 
        email, 
        password: finalPasswordHash, 
        subscription,
        subscribedAt: user.subscribedAt,
        expiryDate: user.expiryDate
    };

    team.members.push(newMember);
    await team.save();

    log("INFO", `Member added to ${team.name}: ${email}`);
    res.status(201).json(newMember);

  } catch (error) {
    log("ERROR", "Failed to add team member", { error: error.message });
    res.status(500).json({ msg: "Failed to add member" });
  }
};

exports.updateTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, subscription, password } = req.body;
    const team = req.team;

    const member = team.members.id(memberId);
    if (!member) {
      log("WARN", `Member not found in team ${team.name}`);
      return res.status(404).json({ msg: "Member not found" });
    }

    // 1. Update Embedded Member
    if (name) member.name = name;
    if (password) member.password = await bcrypt.hash(password, 10);
    if (subscription) member.subscription = subscription;

    // 2. Update Linked User Document
    if (member.userId) {
        const user = await User.findById(member.userId);
        if (user) {
            if (name) user.name = name;
            if (password) user.password = member.password; // Sync password change
            if (subscription) {
                user.subscription = subscription;
                // Handle Pro dates logic
                if (subscription === "Pro") {
                    const now = new Date();
                    const expiry = new Date(now);
                    expiry.setDate(now.getDate() + 30);
                    
                    user.subscribedAt = now;
                    user.expiryDate = expiry;
                    
                    // Sync back to member
                    member.subscribedAt = user.subscribedAt;
                    member.expiryDate = user.expiryDate;
                } else {
                   user.subscribedAt = null;
                   user.expiryDate = null;
                   // Sync back
                   member.subscribedAt = null;
                   member.expiryDate = null;
                }
            }
            await user.save();
        }
    }

    await team.save();

    log("INFO", `Member updated in ${team.name}: ${member.email}`);
    res.json(member);
  } catch (error) {
    log("ERROR", "Failed to update team member", { error });
    res.status(500).json({ msg: "Failed to update member" });
  }
};

exports.removeTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const team = req.team;

    // Find member index
    const memberIndex = team.members.findIndex(
      (m) => m._id.toString() === memberId
    );

    if (memberIndex === -1) {
      log("WARN", `Member not found in team ${team.name}`);
      return res.status(404).json({ msg: "Member not found" });
    }

    const removedMember = team.members[memberIndex];

    // 1. Downgrade the Linked User (Don't delete them, just free them)
    if (removedMember.userId) {
        await User.findByIdAndUpdate(removedMember.userId, {
            subscription: "Free",
            subscribedAt: null,
            expiryDate: null
        });
    }

    // 2. Remove from Team
    team.members.splice(memberIndex, 1);
    await team.save();

    log("INFO", `Member removed from ${team.name}: ${removedMember.email}`);
    res.json({ msg: "Member removed successfully" });
  } catch (error) {
    log("ERROR", "Failed to remove team member", { error });
    res.status(500).json({ msg: "Failed to remove member" });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    // Use the logged-in team ID from the auth middleware
    const teamId = req.team._id;

    const team = await Team.findById(teamId);
    if (!team) {
      log("WARN", `Attempted to delete non-existent team ID: ${teamId}`);
      return res.status(404).json({ msg: "Team not found" });
    }

    await team.deleteOne();
    log("INFO", `Team deleted by leader: ${team.name}`);
    res.json({ msg: "Team deleted successfully" });
  } catch (error) {
    log("ERROR", "Failed to delete team", { error });
    res.status(500).json({ msg: "Failed to delete team" });
  }
};

// ================================================================
// 📊 TEAM DASHBOARD (Combined Access)
// ================================================================

/**
 * @desc   Get team dashboard stats
 * @route  GET /team/dashboard
 * @access Admin/Owner or Team Leader
 */
exports.getTeamDashboardStats = async (req, res) => {
  try {
    // ✅ Determine which team to fetch
    const teamId = req.admin ? req.query.teamId : req.team.id;
    if (!teamId) {
      return res.status(400).json({ msg: "teamId is required for admin access" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      log("WARN", `Team not found for stats: ${teamId}`);
      return res.status(404).json({ msg: "Team not found" });
    }

    // Basic member stats
    const totalMembers = team.members.length;
    const freeMembers = team.members.filter((m) => m.subscription === "Free").length;
    const proMembers = team.members.filter((m) => m.subscription === "Pro").length;

    // Query usage per member (Now we can use userId directly!)
    const usageStats = await QueryHistory.aggregate([
      { $match: { userId: { $in: team.members.map(m => m.userId) } } }, // Match via linked User IDs
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    const memberUsage = team.members.map((m) => {
      const usage = usageStats.find((u) => u._id?.toString() === m.userId?.toString());
      return {
        id: m._id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        subscription: m.subscription,
        totalQueries: usage ? usage.count : 0,
      };
    });

    const totalQueries = usageStats.reduce((sum, u) => sum + u.count, 0);

    const response = {
      teamDetails: {
        id: team._id,
        name: team.name,
        email: team.email,
        description: team.description,
        subscription: team.subscription,
        createdAt: team.createdAt,
      },
      stats: { totalMembers, freeMembers, proMembers, totalQueries },
      members: memberUsage,
    };

    log("INFO", `Team dashboard fetched for ${team.email}`);
    res.json(response);
  } catch (error) {
    log("ERROR", "Failed to fetch team dashboard stats", { error });
    res.status(500).json({ msg: "Failed to fetch team stats" });
  }
};


exports.getUserUsageForTeam = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 🔒 Team access required
    if (!req.team) {
      return res.status(403).json({ msg: "Team access required" });
    }

    // 🔒 Ensure user belongs to this team
    const isMember = req.team.members.some(
      (m) => m.userId?.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ msg: "User not part of your team" });
    }

    log(
      "INFO",
      `Team usage requested for user ${userId} by team ${req.team.email}`
    );

    // 1️⃣ FETCH USER
    const user = await User.findById(userId).select(
      "_id name email subscription subscribedAt expiryDate createdAt"
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 2️⃣ FETCH ALL QUERIES
    const queryList = await QueryHistory.find({ userId }).sort({
      lastUpdated: -1,
    });

    const totalQueries = queryList.length;

    // INITIALIZE ANALYTICS STORAGE
    const moduleUsage = {};
    const modelUsage = { chatGPT: 0, claude: 0, gemini: 0, groq: 0 };
    const providerUsage = { groq: 0, openai: 0, anthropic: 0, google: 0 };

    const detailedQueries = [];

    // 3️⃣ PROCESS EACH QUERY (IDENTICAL TO ADMIN)
    for (const q of queryList) {
      // Module stats
      moduleUsage[q.moduleType] = (moduleUsage[q.moduleType] || 0) + 1;

      let totalTokens = 0;
      let perModel = { chatGPT: 0, claude: 0, gemini: 0, groq: 0 };
      let perProvider = { groq: 0, openai: 0, anthropic: 0, google: 0 };

      const formattedMessages = [];

      for (const msg of q.messages || []) {
        const preview = msg.content ? msg.content.slice(0, 200) : null;

        if (msg.tokenUsage) {
          // ── Shape (1): Aggregated token usage ──
          if (
            typeof msg.tokenUsage.total === "number" ||
            msg.tokenUsage.modelTokens ||
            msg.tokenUsage.providerTokens
          ) {
            const tokens = msg.tokenUsage.total || 0;
            totalTokens += tokens;

            const mTokens = msg.tokenUsage.modelTokens || {};
            for (const mk of Object.keys(mTokens)) {
              const val = mTokens[mk] || 0;
              if (perModel[mk] !== undefined) perModel[mk] += val;
              if (modelUsage[mk] !== undefined) modelUsage[mk] += val;
            }

            const pTokens = msg.tokenUsage.providerTokens || {};
            for (const pk of Object.keys(pTokens)) {
              const val = pTokens[pk] || 0;
              if (perProvider[pk] !== undefined) perProvider[pk] += val;
              if (providerUsage[pk] !== undefined) providerUsage[pk] += val;
            }

            // Derive per-model tokens from individualOutputs if missing
            if (
              (!msg.tokenUsage.modelTokens ||
                Object.keys(msg.tokenUsage.modelTokens).length === 0) &&
              msg.individualOutputs &&
              typeof msg.individualOutputs === "object"
            ) {
              for (const mk of Object.keys(msg.individualOutputs)) {
                const out = msg.individualOutputs[mk] || {};
                const val =
                  out.tokensUsed ||
                  out.totalTokens ||
                  out.tokens ||
                  0;
                if (val) {
                  if (perModel[mk] !== undefined) perModel[mk] += val;
                  if (modelUsage[mk] !== undefined) modelUsage[mk] += val;
                }
              }
            }

          // ── Shape (2): Legacy per-message token usage ──
          } else if (
            msg.tokenUsage.tokens ||
            msg.tokenUsage.model ||
            msg.tokenUsage.provider
          ) {
            const model = msg.tokenUsage.model;
            const provider = msg.tokenUsage.provider;
            const tokens = msg.tokenUsage.tokens || 0;

            totalTokens += tokens;

            if (perModel[model] !== undefined) perModel[model] += tokens;
            if (perProvider[provider] !== undefined)
              perProvider[provider] += tokens;

            if (modelUsage[model] !== undefined)
              modelUsage[model] += tokens;
            if (providerUsage[provider] !== undefined)
              providerUsage[provider] += tokens;
          }
        }

        // ✅ MESSAGE-LEVEL FORMATTING (SAME AS ADMIN)
        formattedMessages.push({
          role: msg.role,
          contentPreview: preview,
          tokenUsage: msg.tokenUsage || null,
          individualOutputs: msg.individualOutputs || null,
        });
      }

      detailedQueries.push({
        id: q._id,
        title: q.title,
        moduleType: q.moduleType,
        createdAt: q.createdAt,
        updatedAt: q.lastUpdated,
        totalTokens,
        modelTokens: perModel,
        providerTokens: perProvider,
        messages: formattedMessages, // ✅ CRITICAL ADDITION
      });
    }

    // 4️⃣ SUMMARY
    const summary = {
      totalQueries,
      totalTokensUsed: Object.values(providerUsage).reduce(
        (a, b) => a + b,
        0
      ),
      modelUsage,
      providerUsage,
      moduleUsage,
    };

    // 5️⃣ FINAL RESPONSE (SCHEMA MATCHES ADMIN)
    res.json({
      user,
      summary,
      recentConversations: queryList.slice(0, 20).map((q) => ({
        queryId: q._id,
        title: q.title,
        moduleType: q.moduleType,
        date: q.lastUpdated,
      })),
      detailedQueries,
    });

  } catch (err) {
    log("ERROR", "Team user usage failed", err);
    res.status(500).json({ msg: "Failed to fetch usage details" });
  }
};


