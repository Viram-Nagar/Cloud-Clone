const cron = require("node-cron");
const db = require("../db");
const supabase = require("../config/supabaseClient");

const initCronJobs = () => {
  // --- Task 1: Clean up expired public links ---
  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("--- Cron: Cleaning expired links ---");
    try {
      const result = await db.query(
        "DELETE FROM link_shares WHERE expires_at < NOW()",
      );
      console.log(`Removed ${result.rowCount} expired links.`);
    } catch (error) {
      console.error("Cron Error (Link Cleanup):", error);
    }
  });

  // --- Task 2: Auto-purge trash older than 30 days ---
  // Runs every day at 1 AM
  cron.schedule("0 1 * * *", async () => {
    console.log("--- Cron: Auto-purging trash older than 30 days ---");
    try {
      // 1. Get all files in trash older than 30 days
      const trashFiles = await db.query(
        `SELECT id, storage_key, name 
         FROM files 
         WHERE is_deleted = true 
         AND updated_at < NOW() - INTERVAL '30 days'`,
      );

      if (trashFiles.rows.length > 0) {
        // 2. Delete from Supabase Storage
        const storageKeys = trashFiles.rows.map((f) => f.storage_key);
        const { error } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .remove(storageKeys);

        if (error) {
          console.error("Cron Storage Delete Error:", error);
        }

        // 3. Delete from DB (cascade handles versions + shares)
        const fileIds = trashFiles.rows.map((f) => f.id);
        await db.query("DELETE FROM files WHERE id = ANY($1::uuid[])", [
          fileIds,
        ]);

        console.log(`Auto-purged ${trashFiles.rows.length} files from trash.`);
      }

      // 4. Delete folders in trash older than 30 days
      const trashFolders = await db.query(
        `DELETE FROM folders 
         WHERE is_deleted = true 
         AND updated_at < NOW() - INTERVAL '30 days'
         RETURNING name`,
      );

      console.log(`Auto-purged ${trashFolders.rowCount} folders from trash.`);
    } catch (error) {
      console.error("Cron Error (Trash Purge):", error);
    }
  });
};

module.exports = initCronJobs;

// const cron = require("node-cron");
// const db = require("../db");

// // This function holds all our scheduled tasks
// const initCronJobs = () => {
//   // Task 1: Clean up expired public links
//   // Schedule: Every day at midnight ('0 0 * * *')
//   cron.schedule("0 0 * * *", async () => {
//     console.log("--- Running Cron Job: Cleaning up expired links ---");
//     try {
//       const result = await db.query(
//         "DELETE FROM link_shares WHERE expires_at < NOW()",
//       );
//       console.log(
//         `Cleanup complete. Removed ${result.rowCount} expired links.`,
//       );
//     } catch (error) {
//       console.error("Cron Job Error (Link Cleanup):", error);
//     }
//   });

//   // Task 2: (Optional) You could also auto-delete trash older than 30 days here
//   /*
//   cron.schedule("0 1 * * *", async () => {
//      // Logic to delete files where is_deleted = true AND updated_at < NOW() - INTERVAL '30 days'
//   });
//   */
// };

// module.exports = initCronJobs;
