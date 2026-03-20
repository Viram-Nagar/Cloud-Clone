import React, { useState, useEffect } from "react";
import { Clock, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../api.jsx";
import FileIcon from "../components/ui/FileIcon";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getMimeLabel = (mime) => {
  if (!mime) return "File";
  if (mime.startsWith("image/")) return "Image";
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("wordprocessingml")) return "Word Document";
  return "File";
};

const Recent = () => {
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const fetchRecentFiles = async () => {
    setLoading(true);
    try {
      const res = await API.get("/files/recent-files", {
        params: { limit: 20 },
      });
      setRecentFiles(res.data.files || []);
    } catch (err) {
      console.error("Failed to fetch recent files:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file) => {
    navigate(
      `/preview/${file.id}?folderId=${file.folder_id ?? ""}&folderName=${encodeURIComponent("Recent")}&fileName=${encodeURIComponent(file.name)}&mimeType=${encodeURIComponent(file.mime_type || "")}&sizeBytes=${file.size_bytes || 0}&path=${encodeURIComponent(JSON.stringify([{ id: null, name: "My Drive" }]))}`,
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 bg-surface p-4 rounded-3xl border border-border shadow-sm">
        <div className="p-2.5 bg-brand-blue/10 rounded-xl">
          <Clock size={22} className="text-brand-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Recent</h2>
          <p className="text-xs text-text-secondary">
            Files you recently opened
          </p>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
          <p className="text-text-secondary font-medium">
            Loading recent files...
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && recentFiles.length === 0 && (
        <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-bg-main rounded-2xl border border-border">
              <Clock size={32} className="text-text-secondary" />
            </div>
            <p className="text-text-primary font-bold">No recent files</p>
            <p className="text-sm text-text-secondary">
              Files you open will appear here.
            </p>
          </div>
        </div>
      )}

      {/* FILE LIST */}
      {!loading && recentFiles.length > 0 && (
        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <AnimatePresence>
            {recentFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleFileClick(file)}
                className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-b-0 cursor-pointer hover:bg-bg-main transition-colors duration-150"
              >
                {/* File Icon */}
                <div className="p-2.5 bg-bg-main rounded-xl shrink-0 border border-border">
                  <FileIcon fileName={file.name} size={20} />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate hover:text-brand-blue">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {getMimeLabel(file.mime_type)}
                    {file.size_bytes > 0 && (
                      <span> · {(file.size_bytes / 1024).toFixed(1)} KB</span>
                    )}
                  </p>
                </div>

                {/* Last Opened Time */}
                <span className="text-xs text-text-secondary shrink-0 font-medium">
                  {formatTime(file.last_opened)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Recent;

// import React, { useState, useEffect } from "react";
// import {
//   Clock,
//   Upload,
//   Download,
//   Trash2,
//   Edit,
//   Share2,
//   Star,
//   FolderPlus,
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import API from "../api.jsx";
// import FilePreviewModal from "../components/ui/FilePreviewModal";

// // --- Action Icon + Color mapping ---
// const ACTION_MAP = {
//   uploaded: {
//     icon: Upload,
//     color: "text-green-500",
//     bg: "bg-green-50",
//     label: "Uploaded",
//   },
//   updated_version: {
//     icon: Upload,
//     color: "text-blue-500",
//     bg: "bg-blue-50",
//     label: "Updated",
//   },
//   download: {
//     icon: Download,
//     color: "text-brand-blue",
//     bg: "bg-brand-blue/10",
//     label: "Downloaded",
//   },
//   deleted: {
//     icon: Trash2,
//     color: "text-red-400",
//     bg: "bg-red-50",
//     label: "Deleted",
//   },
//   renamed: {
//     icon: Edit,
//     color: "text-orange-400",
//     bg: "bg-orange-50",
//     label: "Renamed",
//   },
//   shared: {
//     icon: Share2,
//     color: "text-violet-500",
//     bg: "bg-violet-50",
//     label: "Shared",
//   },
//   shared_publicly: {
//     icon: Share2,
//     color: "text-violet-500",
//     bg: "bg-violet-50",
//     label: "Shared publicly",
//   },
//   starred: {
//     icon: Star,
//     color: "text-yellow-500",
//     bg: "bg-yellow-50",
//     label: "Starred",
//   },
//   unstarred: {
//     icon: Star,
//     color: "text-text-secondary",
//     bg: "bg-bg-main",
//     label: "Unstarred",
//   },
//   created: {
//     icon: FolderPlus,
//     color: "text-cyan-500",
//     bg: "bg-cyan-50",
//     label: "Created",
//   },
// };

// // --- Time formatter ---
// const formatTime = (dateStr) => {
//   const date = new Date(dateStr);
//   const now = new Date();
//   const diffMs = now - date;
//   const diffMins = Math.floor(diffMs / 60000);
//   const diffHours = Math.floor(diffMs / 3600000);
//   const diffDays = Math.floor(diffMs / 86400000);

//   if (diffMins < 1) return "Just now";
//   if (diffMins < 60) return `${diffMins}m ago`;
//   if (diffHours < 24) return `${diffHours}h ago`;
//   if (diffDays < 7) return `${diffDays}d ago`;
//   return date.toLocaleDateString();
// };

// const Recent = () => {
//   const [activities, setActivities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [previewFile, setPreviewFile] = useState(null);

//   // --- Fetch activities ---
//   useEffect(() => {
//     fetchActivities();
//   }, []);

//   const fetchActivities = async () => {
//     setLoading(true);
//     try {
//       const res = await API.get("/files/activity", {
//         params: { limit: 100 }, // show last 100 activities
//       });
//       setActivities(res.data.activities || []);
//     } catch (err) {
//       console.error("Failed to fetch activities:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Handle click on activity item ---
//   const handleItemClick = (activity) => {
//     // Only open preview if file exists and action is not delete
//     if (
//       activity.file_name &&
//       activity.file_name !== "Deleted File" &&
//       activity.action !== "deleted"
//     ) {
//       setPreviewFile({
//         id: activity.file_id,
//         name: activity.file_name,
//       });
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <div className="flex items-center gap-3 bg-surface p-4 rounded-3xl border border-border shadow-sm">
//         <div className="p-2.5 bg-brand-blue/10 rounded-xl">
//           <Clock size={22} className="text-brand-blue" />
//         </div>
//         <div>
//           <h2 className="text-xl font-bold text-text-primary">
//             Recent Activity
//           </h2>
//           <p className="text-xs text-text-secondary">
//             Your last 100 actions across all files and folders
//           </p>
//         </div>
//       </div>

//       {/* LOADING */}
//       {loading && (
//         <div className="flex flex-col items-center justify-center py-32">
//           <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
//           <p className="text-text-secondary font-medium">Loading activity...</p>
//         </div>
//       )}

//       {/* EMPTY STATE */}
//       {!loading && activities.length === 0 && (
//         <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
//           <div className="flex flex-col items-center gap-3">
//             <div className="p-4 bg-bg-main rounded-2xl border border-border">
//               <Clock size={32} className="text-text-secondary" />
//             </div>
//             <p className="text-text-primary font-bold">No recent activity</p>
//             <p className="text-sm text-text-secondary">
//               Actions like uploads, downloads, and shares will appear here.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ACTIVITY LIST */}
//       {!loading && activities.length > 0 && (
//         <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
//           <AnimatePresence>
//             {activities.map((activity, index) => {
//               const actionConfig = ACTION_MAP[activity.action] || {
//                 icon: Clock,
//                 color: "text-text-secondary",
//                 bg: "bg-bg-main",
//                 label: activity.action,
//               };
//               const Icon = actionConfig.icon;

//               // Determine name to show
//               const itemName =
//                 activity.file_name !== "Deleted File"
//                   ? activity.file_name
//                   : activity.folder_name !== "Deleted Folder"
//                     ? activity.folder_name
//                     : "Deleted item";

//               const isClickable =
//                 activity.file_name &&
//                 activity.file_name !== "Deleted File" &&
//                 activity.action !== "deleted";

//               return (
//                 <motion.div
//                   key={activity.id}
//                   initial={{ opacity: 0, x: -10 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: index * 0.03 }}
//                   onClick={() => handleItemClick(activity)}
//                   className={`
//                     flex items-center gap-4 px-5 py-4
//                     border-b border-border/60 last:border-b-0
//                     transition-colors duration-150
//                     ${
//                       isClickable
//                         ? "cursor-pointer hover:bg-bg-main"
//                         : "cursor-default"
//                     }
//                   `}
//                 >
//                   {/* Action Icon */}
//                   <div
//                     className={`p-2.5 rounded-xl shrink-0 ${actionConfig.bg}`}
//                   >
//                     <Icon size={16} className={actionConfig.color} />
//                   </div>

//                   {/* Content */}
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
//                         {actionConfig.label}
//                       </span>
//                     </div>
//                     <p
//                       className={`text-sm font-bold truncate mt-0.5 ${
//                         isClickable
//                           ? "text-text-primary hover:text-brand-blue"
//                           : "text-text-secondary"
//                       }`}
//                     >
//                       {itemName}
//                     </p>
//                   </div>

//                   {/* Time */}
//                   <span className="text-xs text-text-secondary shrink-0 font-medium">
//                     {formatTime(activity.created_at)}
//                   </span>
//                 </motion.div>
//               );
//             })}
//           </AnimatePresence>
//         </div>
//       )}

//       {/* FILE PREVIEW MODAL */}
//       <FilePreviewModal
//         file={previewFile}
//         isOpen={!!previewFile}
//         onClose={() => setPreviewFile(null)}
//       />
//     </div>
//   );
// };

// export default Recent;
