const QueryHistory = require("../models/QueryHistory");
const log = require("../utils/logger");

/**
 * Middleware to block SmartMix requests based on plan limits
 * - Free daily new chat limit
 * - Free conversation length limit
 * - Ownership validation
 */
module.exports = async function smartmixGuard(req, res, next) {
  try {
    const { conversationId } = req.body;
    const user = req.user;
    const isNewChat = !conversationId;

    // -----------------------------------
    // 1️⃣ FREE PLAN — DAILY NEW CHAT LIMIT
    // -----------------------------------
    if (user.subscription === "Free" && isNewChat) {
      if (user.dailyQueryCount >= 3) {
        log("WARN", "🛑 Free daily limit blocked", {
          user: user.email,
          dailyQueryCount: user.dailyQueryCount
        });

        return res.status(403).json({
          msg: "Daily limit reached. Upgrade to Pro to start new chats."
        });
      }
    }

    // -----------------------------------
    // 2️⃣ EXISTING CONVERSATION CHECKS
    // -----------------------------------
    if (!isNewChat) {
      const conversation = await QueryHistory.findOne({
        _id: conversationId,
        userId: user._id
      });

      // Ownership validation
      if (!conversation) {
        log("WARN", "🛑 Unauthorized conversation access", {
          user: user.email,
          conversationId
        });

        return res.status(404).json({
          msg: "Conversation not found or unauthorized"
        });
      }

      // -----------------------------------
      // 3️⃣ FREE PLAN — CONVERSATION LENGTH
      // -----------------------------------
      if (user.subscription === "Free") {
        const userMessageCount = conversation.messages.filter(
          m => m.role === "user"
        ).length;

        if (userMessageCount >= 10) {
          log("WARN", "🛑 Free conversation length blocked", {
            user: user.email,
            conversationId,
            userMessageCount
          });

          return res.status(403).json({
            msg: "Free conversation limit reached (10 messages). Upgrade to Pro."
          });
        }
      }

      // Attach conversation to req to avoid refetching in controller
      req.conversation = conversation;
    }

    // -----------------------------------
    // ✅ PASS THROUGH
    // -----------------------------------
    next();

  } catch (err) {
    log("ERROR", "SmartMix guard failed", {
      error: err.message,
      stack: err.stack
    });

    return res.status(500).json({
      msg: "Request blocked due to validation error",
      error: err.message
    });
  }
};
