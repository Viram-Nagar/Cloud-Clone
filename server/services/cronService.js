const cron = require("node-cron");
const db = require("../db");

// This function holds all our scheduled tasks
const initCronJobs = () => {
  // Task 1: Clean up expired public links
  // Schedule: Every day at midnight ('0 0 * * *')
  cron.schedule("0 0 * * *", async () => {
    console.log("--- Running Cron Job: Cleaning up expired links ---");
    try {
      const result = await db.query(
        "DELETE FROM link_shares WHERE expires_at < NOW()",
      );
      console.log(
        `Cleanup complete. Removed ${result.rowCount} expired links.`,
      );
    } catch (error) {
      console.error("Cron Job Error (Link Cleanup):", error);
    }
  });

  // Task 2: (Optional) You could also auto-delete trash older than 30 days here
  /*
  cron.schedule("0 1 * * *", async () => {
     // Logic to delete files where is_deleted = true AND updated_at < NOW() - INTERVAL '30 days'
  });
  */
};

module.exports = initCronJobs;
