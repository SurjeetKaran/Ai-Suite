const cron = require("node-cron");
const User = require("../models/User");
const Team = require("../models/Team");
const log = require("./logger");

/**
 * Schedule a daily job to reset Free users' dailyQueryCount to 0
 * Runs every day at 00:00 server time
 */
const scheduleDailyQueryReset = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      // --- Reset Free users ---
      const resultUsers = await User.updateMany(
        { subscription: "Free", dailyQueryCount: { $gt: 0 } },
        { $set: { dailyQueryCount: 0 } }
      );
      log(
        "INFO",
        `Daily query count reset for Free users. Modified ${resultUsers.modifiedCount} users.`
      );

      // --- Reset Free team members ---
      const teams = await Team.find();
      let totalMembersReset = 0;

      for (const team of teams) {
        let modified = false;
        for (const member of team.members) {
          if (member.subscription === "Free" && member.dailyQueryCount > 0) {
            member.dailyQueryCount = 0;
            modified = true;
            totalMembersReset++;
          }
        }
        if (modified) await team.save();
      }

      log(
        "INFO",
        `Daily query count reset for Free team members. Total modified members: ${totalMembersReset}`
      );
    } catch (err) {
      log("ERROR", "Failed to reset daily query count", err.stack);
    }
  });

  log("INFO", "Daily query reset cron job scheduled at 00:00 every day");
};

module.exports = scheduleDailyQueryReset;

