const cron = require("node-cron");
const db = require("../db");
const supabase = require("../config/supabaseClient");

const initCronJobs = () => {
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

  cron.schedule("0 1 * * *", async () => {
    console.log("--- Cron: Auto-purging trash older than 30 days ---");
    try {
      const trashFiles = await db.query(
        `SELECT id, storage_key, name 
         FROM files 
         WHERE is_deleted = true 
         AND updated_at < NOW() - INTERVAL '30 days'`,
      );

      if (trashFiles.rows.length > 0) {
        const storageKeys = trashFiles.rows.map((f) => f.storage_key);
        const { error } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .remove(storageKeys);

        if (error) {
          console.error("Cron Storage Delete Error:", error);
        }

        const fileIds = trashFiles.rows.map((f) => f.id);
        await db.query("DELETE FROM files WHERE id = ANY($1::uuid[])", [
          fileIds,
        ]);

        console.log(`Auto-purged ${trashFiles.rows.length} files from trash.`);
      }

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
