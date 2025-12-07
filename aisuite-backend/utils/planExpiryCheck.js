const cron = require("node-cron");
const User = require("../models/User");
const Team = require("../models/Team");
const log = require("./logger");

/**
 * Schedule a daily job to downgrade expired Pro users and team members to Free plan.
 * Runs every day at 00:10 server time
 */
const schedulePlanExpiryCheck = () => {
  cron.schedule("10 0 * * *", async () => {
    try {
      const now = new Date();

      // --- Users ---
      const expiredUsers = await User.find({
        subscription: "Pro",
        expiryDate: { $lte: now },
      });

      for (const user of expiredUsers) {
        user.subscription = "Free";
        user.subscribedAt = null;
        user.expiryDate = null;
        await user.save();
        log("INFO", `User ${user.email} downgraded to Free (plan expired).`);
      }

      log(
        "INFO",
        `Plan expiry check completed for Users. Downgraded ${expiredUsers.length} user(s).`
      );

      // --- Team Members ---
      const teams = await Team.find();
      let totalMembersDowngraded = 0;

      for (const team of teams) {
        let modified = false;

        for (const member of team.members) {
          if (member.subscription === "Pro" && member.expiryDate <= now) {
            member.subscription = "Free";
            member.subscribedAt = null;
            member.expiryDate = null;
            modified = true;
            totalMembersDowngraded++;
          }
        }

        if (modified) await team.save();
      }

      log(
        "INFO",
        `Plan expiry check completed for Team Members. Downgraded ${totalMembersDowngraded} member(s).`
      );

    } catch (err) {
      log("ERROR", "Failed to process plan expiry check", err.stack);
    }
  });

  log("INFO", "Plan expiry cron job scheduled at 00:10 every day");
};

module.exports = schedulePlanExpiryCheck;
