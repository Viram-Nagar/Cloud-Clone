import React, { useState, useRef } from "react";
import {
  MoreVertical,
  Star,
  Download,
  Pencil,
  Trash2,
  Share2,
  History,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import Card from "./Card";
import FileIcon from "./FileIcon";
import Button from "./Button";
import ContextMenu from "./ContextMenu";
import API from "../../api.jsx";

const FileCard = ({ file, onAction, onPreview, onStarToggle }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(file.is_starred || false);
  const [isStarring, setIsStarring] = useState(false);

  // --- Star toggle handler ---
  const handleStarToggle = async (e) => {
    e.stopPropagation(); // prevent file preview
    if (isStarring) return;
    setIsStarring(true);

    // Optimistic update
    setIsStarred((prev) => !prev);

    try {
      await API.post("/files/stars/toggle", {
        fileId: file.id,
      });
      onStarToggle?.();
    } catch (err) {
      // Revert on error
      setIsStarred((prev) => !prev);
      console.error("Star toggle failed:", err);
    } finally {
      setIsStarring(false);
    }
  };

  const handleReupload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      await API.post(`/files/upload/${file.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onAction?.(file, "reupload_done");
    } catch (err) {
      console.error("Re-upload failed:", err);
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  };

  const menuItems = [
    {
      label: "Download",
      icon: Download,
      onClick: () => onAction?.(file, "download"),
    },
    {
      label: "Update File",
      icon: RefreshCw,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      label: "Version History",
      icon: History,
      onClick: () => onAction?.(file, "versions"),
    },
    {
      label: "Rename",
      icon: Pencil,
      onClick: () => onAction?.(file, "rename"),
    },
    {
      label: "Share",
      icon: Share2,
      onClick: () => onAction?.(file, "share"),
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: () => onAction?.(file, "delete"),
      variant: "danger",
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative"
      onClick={() => onPreview?.(file)}
    >
      {/* Hidden file input for re-upload */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleReupload}
      />

      <Card
        className={`group p-3 cursor-pointer hover:shadow-xl transition-all border-border/60 ${isMenuOpen ? "z-20" : ""} ${isUploading ? "opacity-60" : ""}`}
      >
        {/* uploading indicator */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-3xl z-10">
            <div className="animate-spin h-6 w-6 border-4 border-brand-blue border-t-transparent rounded-full" />
          </div>
        )}
        <div className="flex items-start justify-between mb-4">
          {/* File Icon */}
          <div className="p-3 bg-bg-main rounded-2xl group-hover:scale-110 transition-transform">
            <FileIcon fileName={file.name} size={32} />
          </div>

          {/* MoreVertical trigger */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
            >
              <MoreVertical size={16} />
            </Button>

            <ContextMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              items={menuItems}
            />
          </div>
        </div>

        <div className="space-y-1">
          <h4
            className="text-sm font-bold text-text-primary truncate"
            title={file.name}
          >
            {file.name}
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary uppercase font-semibold">
              {file.size_bytes
                ? (file.size_bytes / 1024).toFixed(1) + " KB"
                : "—"}
            </span>

            {/* STAR BUTTON */}
            <button
              onClick={handleStarToggle}
              disabled={isStarring}
              className="p-1 rounded-lg hover:bg-yellow-50 transition-colors"
              title={isStarred ? "Remove from starred" : "Add to starred"}
            >
              <Star
                size={13}
                className={`transition-colors ${
                  isStarred
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-text-secondary/40 hover:text-yellow-400"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FileCard;

// import React, { useState } from "react";
// import {
//   MoreVertical,
//   Star,
//   Download,
//   Pencil,
//   Trash2,
//   Share2,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import Card from "./Card";
// import FileIcon from "./FileIcon";
// import Button from "./Button";
// import ContextMenu from "./ContextMenu";

// const FileCard = ({ file, onAction, onPreview }) => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   const menuItems = [
//     {
//       label: "Download",
//       icon: Download,
//       onClick: () => onAction?.(file, "download"),
//     },
//     {
//       label: "Rename",
//       icon: Pencil,
//       onClick: () => onAction?.(file, "rename"),
//     },
//     {
//       label: "Share",
//       icon: Share2,
//       onClick: () => onAction?.(file, "share"),
//     },
//     {
//       label: "Delete",
//       icon: Trash2,
//       onClick: () => onAction?.(file, "delete"),
//       variant: "danger",
//     },
//   ];

//   return (
//     // <motion.div
//     //   layout
//     //   initial={{ opacity: 0, scale: 0.9 }}
//     //   animate={{ opacity: 1, scale: 1 }}
//     //   whileHover={{ y: -4 }}
//     //   transition={{ duration: 0.2 }}
//     //   onClick={() => onPreview?.(file)}
//     // >
//     //   <Card
//     //     className={`group p-3 cursor-pointer hover:shadow-xl transition-all border-border/60 relative ${isMenuOpen ? "z-20" : "z-0"}`}
//     //   >
//     //     <div className="flex items-start justify-between mb-4">
//     //       {/* File Icon */}
//     //       <div className="p-3 bg-bg-main rounded-2xl group-hover:scale-110 transition-transform">
//     //         <FileIcon fileName={file.name} size={32} />
//     //       </div>

//     //       {/* MoreVertical trigger — relative wrapper for menu positioning */}
//     //       <div className="relative">
//     //         <Button
//     //           variant="ghost"
//     //           size="sm"
//     //           className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//     //           onClick={(e) => {
//     //             e.stopPropagation(); // prevent card click (file preview)
//     //             setIsMenuOpen((prev) => !prev);
//     //           }}
//     //         >
//     //           <MoreVertical size={16} />
//     //         </Button>

//     //         <ContextMenu
//     //           isOpen={isMenuOpen}
//     //           onClose={() => setIsMenuOpen(false)}
//     //           items={menuItems}
//     //         />
//     //       </div>
//     //     </div>

//     //     <div className="space-y-1">
//     //       <h4
//     //         className="text-sm font-bold text-text-primary truncate"
//     //         title={file.name}
//     //       >
//     //         {file.name}
//     //       </h4>
//     //       <div className="flex items-center justify-between">
//     //         <span className="text-[10px] text-text-secondary uppercase font-semibold">
//     //           {file.size_bytes
//     //             ? (file.size_bytes / 1024).toFixed(1) + " KB"
//     //             : "—"}
//     //         </span>
//     //         {file.is_starred && (
//     //           <Star size={12} className="fill-yellow-400 text-yellow-400" />
//     //         )}
//     //       </div>
//     //     </div>
//     //   </Card>
//     // </motion.div>

//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       transition={{ duration: 0.2 }}
//       className="relative" // relative moved HERE
//       onClick={() => onPreview?.(file)}
//     >
//       <Card
//         className={`group p-3 cursor-pointer hover:shadow-xl transition-all border-border/60 ${isMenuOpen ? "z-20" : ""}`}
//       >
//         <div className="flex items-start justify-between mb-4">
//           <div className="p-3 bg-bg-main rounded-2xl group-hover:scale-110 transition-transform">
//             <FileIcon fileName={file.name} size={32} />
//           </div>

//           <Button
//             variant="ghost"
//             size="sm"
//             className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//             onClick={(e) => {
//               e.stopPropagation();
//               setIsMenuOpen((prev) => !prev);
//             }}
//           >
//             <MoreVertical size={16} />
//           </Button>
//         </div>

//         <div className="space-y-1">
//           <h4
//             className="text-sm font-bold text-text-primary truncate"
//             title={file.name}
//           >
//             {file.name}
//           </h4>
//           <div className="flex items-center justify-between">
//             <span className="text-[10px] text-text-secondary uppercase font-semibold">
//               {file.size_bytes
//                 ? (file.size_bytes / 1024).toFixed(1) + " KB"
//                 : "—"}
//             </span>
//             {file.is_starred && (
//               <Star size={12} className="fill-yellow-400 text-yellow-400" />
//             )}
//           </div>
//         </div>
//       </Card>

//       {/* ContextMenu is NOW outside Card, inside motion.div */}
//       <ContextMenu
//         isOpen={isMenuOpen}
//         onClose={() => setIsMenuOpen(false)}
//         items={menuItems}
//       />
//     </motion.div>
//   );
// };

// export default FileCard;

// import React from "react";
// import { MoreVertical, Star } from "lucide-react";
// import { motion } from "framer-motion"; // Adding Framer Motion
// import Card from "./Card";
// import FileIcon from "./FileIcon";
// import Button from "./Button";

// const FileCard = ({ file, onAction, onPreview }) => {
//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       transition={{ duration: 0.2 }}
//       onClick={() => onPreview?.(file)}
//     >
//       <Card className="group p-3 cursor-pointer hover:shadow-xl transition-all border-border/60 ">
//         <div className="flex items-start justify-between mb-4">
//           {/* File Icon based on MimeType */}
//           <div className="p-3 bg-bg-main rounded-2xl group-hover:scale-110 transition-transform">
//             <FileIcon fileName={file.name} size={32} />
//           </div>

//           <Button
//             variant="ghost"
//             size="sm"
//             className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//           >
//             <MoreVertical size={16} />
//           </Button>
//         </div>

//         <div className="space-y-1">
//           <h4
//             className="text-sm font-bold text-text-primary truncate"
//             title={file.name}
//           >
//             {file.name}
//           </h4>
//           <div className="flex items-center justify-between">
//             <span className="text-[10px] text-text-secondary uppercase font-semibold">
//               {file.size_bytes
//                 ? (file.size_bytes / 1024).toFixed(1) + " KB"
//                 : "—"}
//             </span>
//             {file.isStarred && (
//               <Star size={12} className="fill-yellow-400 text-yellow-400" />
//             )}
//           </div>
//         </div>
//       </Card>
//     </motion.div>
//   );
// };

// export default FileCard;
