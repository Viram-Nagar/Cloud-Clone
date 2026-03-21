const db = require("../db");

/**
  @param {string} requiredRole 
 */
const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    const userId = req.user.id;

    const resourceId = req.params.id || req.body.fileId || req.body.folderId;

    if (!resourceId) {
      return res
        .status(400)
        .json({ message: "Resource ID is required for permission check" });
    }

    try {
      const ownerQuery = `
        SELECT owner_id FROM files WHERE id = $1
        UNION ALL
        SELECT owner_id FROM folders WHERE id = $1;
      `;
      const ownerResult = await db.query(ownerQuery, [resourceId]);

      if (
        ownerResult.rows.length > 0 &&
        ownerResult.rows[0].owner_id === userId
      ) {
        return next();
      }

      const shareQuery = `
        SELECT role FROM shares 
        WHERE (file_id = $1 OR folder_id = $1) 
        AND grantee_id = $2;
      `;
      const shareResult = await db.query(shareQuery, [resourceId, userId]);

      if (shareResult.rows.length === 0) {
        return res.status(403).json({
          message:
            "Access denied: You do not have permission to access this resource",
        });
      }

      const userRole = shareResult.rows[0].role;

      if (requiredRole === "editor" && userRole !== "editor") {
        return res
          .status(403)
          .json({ message: "Access denied: Editor permissions required" });
      }

      next();
    } catch (error) {
      console.error("Permission Middleware Error:", error);
      res
        .status(500)
        .json({ message: "Internal server error during permission check" });
    }
  };
};

module.exports = { checkPermission };
