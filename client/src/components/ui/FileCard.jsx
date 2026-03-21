import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Star,
  Download,
  Pencil,
  Trash2,
  Share2,
  History,
  RefreshCw,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Card from "./Card";
import FileIcon from "./FileIcon";
import Button from "./Button";
import ContextMenu from "./ContextMenu";
import API from "../../api.jsx";
import { toast } from "react-toastify";

// --- Preview Component (unchanged) ---
// const FilePreview = ({ file }) => {
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const containerRef = useRef(null);
//   const [isVisible, setIsVisible] = useState(false);

//   const mime = file.mime_type || "";
//   const isImage = mime.startsWith("image/");
//   const isPDF = mime === "application/pdf";

//   useEffect(() => {
//     if (!isImage && !isPDF) return;
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setIsVisible(true);
//           observer.disconnect();
//         }
//       },
//       { threshold: 0.1 },
//     );
//     if (containerRef.current) observer.observe(containerRef.current);
//     return () => observer.disconnect();
//   }, [isImage, isPDF]);

//   useEffect(() => {
//     if (!isVisible || !file.id) return;
//     let cancelled = false;
//     const fetchPreview = async () => {
//       setLoading(true);
//       try {
//         const res = await API.get(`/files/${file.id}/download`);
//         if (!cancelled) setPreviewUrl(res.data.downloadUrl);
//       } catch (err) {
//         console.error("Preview fetch failed:", err);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };
//     fetchPreview();
//     return () => {
//       cancelled = true;
//     };
//   }, [isVisible, file.id]);

//   if (isImage) {
//     return (
//       <div
//         ref={containerRef}
//         className="w-full rounded-xl overflow-hidden bg-bg-main flex items-center justify-center"
//         style={{ aspectRatio: "1/1" }}
//       >
//         {!isVisible || loading ? (
//           <div className="animate-spin h-5 w-5 border-2 border-brand-blue border-t-transparent rounded-full" />
//         ) : previewUrl ? (
//           <img
//             src={previewUrl}
//             alt={file.name}
//             className="w-full h-full object-cover"
//             onError={() => setPreviewUrl(null)}
//           />
//         ) : (
//           <FileIcon fileName={file.name} size={36} />
//         )}
//       </div>
//     );
//   }

//   if (isPDF) {
//     return (
//       <div
//         ref={containerRef}
//         className="w-full rounded-xl overflow-hidden bg-red-50 flex items-center justify-center border border-red-100"
//         style={{ aspectRatio: "1/1" }}
//       >
//         {!isVisible || loading ? (
//           <div className="animate-spin h-5 w-5 border-2 border-red-400 border-t-transparent rounded-full" />
//         ) : previewUrl ? (
//           <iframe
//             src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
//             className="w-full h-full pointer-events-none"
//             title={file.name}
//           />
//         ) : (
//           <FileIcon fileName={file.name} size={36} />
//         )}
//       </div>
//     );
//   }

//   if (
//     mime ===
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//   ) {
//     return (
//       <div
//         className="w-full rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center gap-2"
//         style={{ aspectRatio: "1/1" }}
//       >
//         <FileText size={32} className="text-blue-500" />
//         <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
//           Word Document
//         </span>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="w-full rounded-xl bg-bg-main border border-border flex items-center justify-center"
//       style={{ aspectRatio: "1/1" }}
//     >
//       <FileIcon fileName={file.name} size={36} />
//     </div>
//   );
// };

const FilePreview = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const mime = file.mime_type || "";
  const isImage = mime.startsWith("image/") && mime !== "image/svg+xml";
  const isPDF = mime === "application/pdf";

  useEffect(() => {
    if (!isImage && !isPDF) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isImage, isPDF]);

  useEffect(() => {
    if (!isVisible || !file.id) return;
    let cancelled = false;
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/files/${file.id}/download`);
        if (!cancelled) setPreviewUrl(res.data.downloadUrl);
      } catch (err) {
        console.error("Preview fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [isVisible, file.id]);

  // --- Image preview (actual thumbnail) ---
  if (isImage) {
    return (
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden bg-bg-main flex items-center justify-center"
        style={{ aspectRatio: "1/1" }}
      >
        {!isVisible || loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-brand-blue border-t-transparent rounded-full" />
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={() => setPreviewUrl(null)}
          />
        ) : (
          <FileIcon fileName={file.name} size={36} />
        )}
      </div>
    );
  }

  // --- All other file types — show styled icon ---
  const getIconStyle = (mime) => {
    if (mime === "application/pdf")
      return {
        bg: "bg-red-50",
        border: "border-red-100",
        label: "PDF",
        labelColor: "text-red-400",
      };
    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword"
    )
      return {
        bg: "bg-blue-50",
        border: "border-blue-100",
        label: "Word",
        labelColor: "text-blue-400",
      };
    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mime === "application/vnd.ms-excel"
    )
      return {
        bg: "bg-green-50",
        border: "border-green-100",
        label: "Excel",
        labelColor: "text-green-500",
      };
    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      mime === "application/vnd.ms-powerpoint"
    )
      return {
        bg: "bg-orange-50",
        border: "border-orange-100",
        label: "PowerPoint",
        labelColor: "text-orange-400",
      };
    if (mime === "text/plain")
      return {
        bg: "bg-slate-50",
        border: "border-slate-100",
        label: "Text",
        labelColor: "text-slate-400",
      };
    if (mime === "text/csv")
      return {
        bg: "bg-green-50",
        border: "border-green-100",
        label: "CSV",
        labelColor: "text-green-500",
      };
    if (mime.startsWith("video/"))
      return {
        bg: "bg-violet-50",
        border: "border-violet-100",
        label: "Video",
        labelColor: "text-violet-400",
      };
    if (mime.startsWith("audio/"))
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-100",
        label: "Audio",
        labelColor: "text-emerald-400",
      };
    if (mime === "image/svg+xml")
      return {
        bg: "bg-orange-50",
        border: "border-orange-100",
        label: "SVG",
        labelColor: "text-orange-400",
      };
    return {
      bg: "bg-bg-main",
      border: "border-border",
      label: "File",
      labelColor: "text-text-secondary",
    };
  };

  const style = getIconStyle(mime);

  return (
    <div
      className={`w-full rounded-xl ${style.bg} border ${style.border} flex flex-col items-center justify-center gap-2`}
      style={{ aspectRatio: "1/1" }}
    >
      <FileIcon fileName={file.name} size={32} />
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${style.labelColor}`}
      >
        {style.label}
      </span>
    </div>
  );
};

// --- Main FileCard ---
const FileCard = ({
  file,
  onAction,
  onStarToggle,
  currentFolderId,
  folderName,
  fullPath,
  sharedRole,
  isShared,
  source = "dashboard",
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(file.is_starred || false);
  const [isStarring, setIsStarring] = useState(false);
  const navigate = useNavigate();

  // Sync star state when file prop changes (e.g. after navigation)
  useEffect(() => {
    setIsStarred(file.is_starred || false);
  }, [file.is_starred]);

  // --- Drag setup ---
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `file-${file.id}`,
      data: {
        type: "file",
        id: file.id,
        name: file.name,
      },
    });

  // Transform style — moves card while dragging
  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
    cursor: isDragging ? "grabbing" : "grab",
  };

  const handleStarToggle = async (e) => {
    e.stopPropagation();
    if (isStarring) return;
    setIsStarring(true);
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    try {
      await API.post("/files/stars/toggle", { fileId: file.id });
      toast(newStarred ? "⭐ Added to Starred" : "Removed from Starred", {
        type: newStarred ? "success" : "info",
      });
      onStarToggle?.();
    } catch (err) {
      setIsStarred((prev) => !prev);
      toast.error("Failed to update star");
      console.error("Star toggle failed:", err);
    } finally {
      setIsStarring(false);
    }
  };

  // const handleStarToggle = async (e) => {
  //   e.stopPropagation();
  //   if (isStarring) return;
  //   setIsStarring(true);
  //   setIsStarred((prev) => !prev);
  //   try {
  //     await API.post("/files/stars/toggle", { fileId: file.id });
  //     onStarToggle?.();
  //   } catch (err) {
  //     setIsStarred((prev) => !prev);
  //     console.error("Star toggle failed:", err);
  //   } finally {
  //     setIsStarring(false);
  //   }
  // };

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
      e.target.value = "";
    }
  };

  // const menuItems = [
  //   {
  //     label: "Download",
  //     icon: Download,
  //     onClick: () => onAction?.(file, "download"),
  //   },
  //   {
  //     label: "Update File",
  //     icon: RefreshCw,
  //     onClick: () => fileInputRef.current?.click(),
  //   },
  //   {
  //     label: "Version History",
  //     icon: History,
  //     onClick: () => onAction?.(file, "versions"),
  //   },
  //   {
  //     label: "Rename",
  //     icon: Pencil,
  //     onClick: () => onAction?.(file, "rename"),
  //   },
  //   { label: "Share", icon: Share2, onClick: () => onAction?.(file, "share") },
  //   {
  //     label: "Delete",
  //     icon: Trash2,
  //     onClick: () => onAction?.(file, "delete"),
  //     variant: "danger",
  //   },
  // ];

  const allMenuItems = [
    {
      label: "Download",
      icon: Download,
      onClick: () => onAction?.(file, "download"),
      showFor: ["owner", "viewer", "editor"],
    },
    {
      label: "Update File",
      icon: RefreshCw,
      onClick: () => fileInputRef.current?.click(),
      showFor: ["owner"],
    },
    {
      label: "Version History",
      icon: History,
      onClick: () => onAction?.(file, "versions"),
      showFor: ["owner"],
    },
    {
      label: "Rename",
      icon: Pencil,
      onClick: () => onAction?.(file, "rename"),
      showFor: ["owner", "editor"],
    },
    {
      label: "Share",
      icon: Share2,
      onClick: () => onAction?.(file, "share"),
      showFor: ["owner"],
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: () => onAction?.(file, "delete"),
      variant: "danger",
      showFor: ["owner"],
    },
  ];

  const userRole = sharedRole || "owner";
  const menuItems = allMenuItems.filter((item) =>
    item.showFor.includes(userRole),
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      // --- Drag ref + style ---
      ref={setNodeRef}
      style={dragStyle}
      className="relative"
      // --- Click opens preview ONLY if not dragging ---
      onClick={() => {
        if (!isDragging) {
          console.log("fullPath being sent:", fullPath);

          navigate(
            `/preview/${file.id}?folderId=${currentFolderId ?? ""}&folderName=${encodeURIComponent(folderName ?? "My Drive")}&fileName=${encodeURIComponent(file.name)}&mimeType=${encodeURIComponent(file.mime_type || "")}&sizeBytes=${file.size_bytes || 0}&path=${encodeURIComponent(JSON.stringify(fullPath ?? []))}&source=${source}`,
          );
        }
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleReupload}
      />

      <Card
        className={`
          group p-2 cursor-grab active:cursor-grabbing hover:shadow-xl
          transition-all border-border/60
          ${isMenuOpen ? "z-20" : ""}
          ${isUploading ? "opacity-60" : ""}
          ${isDragging ? "shadow-2xl ring-2 ring-brand-blue/40" : ""}
        `}
      >
        {/* Upload spinner */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-3xl z-10">
            <div className="animate-spin h-6 w-6 border-4 border-brand-blue border-t-transparent rounded-full" />
          </div>
        )}

        {/* Drag handle — covers preview area */}
        <div className="relative" {...listeners} {...attributes}>
          <FilePreview file={file} />

          {/* Star button */}
          <button
            onClick={handleStarToggle}
            disabled={isStarring}
            className="absolute top-2 left-2 p-1.5 bg-surface/80 rounded-lg hover:bg-yellow-50 transition-colors opacity-100"
            title={isStarred ? "Remove from starred" : "Add to starred"}
            // Stop drag from firing when clicking star
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Star
              size={12}
              className={`transition-colors ${
                isStarred
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-text-secondary/60 hover:text-yellow-400"
              }`}
            />
          </button>

          {/* 3 dots menu */}
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 bg-surface/80 rounded-lg opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              // Stop drag from firing when clicking menu
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreVertical size={14} />
            </Button>
            <ContextMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              items={menuItems}
            />
          </div>
        </div>

        {/* File name + size */}
        <div className="h-10 flex flex-col justify-center px-1">
          <h4
            className="text-sm font-bold text-text-primary truncate"
            title={file.name}
          >
            {file.name}
          </h4>
          <span className="text-[10px] text-text-secondary uppercase font-semibold">
            {file.size_bytes
              ? (file.size_bytes / 1024).toFixed(1) + " KB"
              : "—"}
          </span>
        </div>
      </Card>
    </motion.div>
  );
};

export default FileCard;

// import React, { useState, useRef, useEffect } from "react";
// import {
//   MoreVertical,
//   Star,
//   Download,
//   Pencil,
//   Trash2,
//   Share2,
//   History,
//   RefreshCw,
//   FileText,
//   Music,
//   Archive,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import Card from "./Card";
// import FileIcon from "./FileIcon";
// import Button from "./Button";
// import ContextMenu from "./ContextMenu";
// import API from "../../api.jsx";

// // --- Preview Component ---
// const FilePreview = ({ file }) => {
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const containerRef = useRef(null);
//   const [isVisible, setIsVisible] = useState(false);

//   const mime = file.mime_type || "";
//   const isImage = mime.startsWith("image/");
//   const isPDF = mime === "application/pdf";

//   // --- Step 1: Watch visibility ---
//   useEffect(() => {
//     if (!isImage && !isPDF) return;

//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setIsVisible(true);
//           observer.disconnect(); // Stop watching once visible
//         }
//       },
//       { threshold: 0.1 }, // 10% of card visible = start fetch
//     );

//     if (containerRef.current) {
//       observer.observe(containerRef.current);
//     }

//     return () => observer.disconnect();
//   }, [isImage, isPDF]);

//   // --- Step 2: Fetch only when visible ---
//   useEffect(() => {
//     if (!isVisible) return;
//     if (!file.id) return;

//     let cancelled = false;

//     const fetchPreview = async () => {
//       setLoading(true);
//       try {
//         const res = await API.get(`/files/${file.id}/download`);
//         if (!cancelled) setPreviewUrl(res.data.downloadUrl);
//       } catch (err) {
//         console.error("Preview fetch failed:", err);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     fetchPreview();
//     return () => {
//       cancelled = true;
//     };
//   }, [isVisible, file.id]);

//   // --- Image Preview ---
//   if (isImage) {
//     return (
//       <div
//         ref={containerRef}
//         className="w-full rounded-xl overflow-hidden bg-bg-main flex items-center justify-center"
//         style={{ aspectRatio: "1/1" }}
//       >
//         {!isVisible || loading ? (
//           <div className="animate-spin h-5 w-5 border-2 border-brand-blue border-t-transparent rounded-full" />
//         ) : previewUrl ? (
//           <img
//             src={previewUrl}
//             alt={file.name}
//             className="w-full h-full object-cover"
//             onError={() => setPreviewUrl(null)}
//           />
//         ) : (
//           <FileIcon fileName={file.name} size={36} />
//         )}
//       </div>
//     );
//   }

//   // --- PDF Preview ---
//   if (isPDF) {
//     return (
//       <div
//         ref={containerRef}
//         className="w-full rounded-xl overflow-hidden bg-red-50 flex items-center justify-center border border-red-100"
//         style={{ aspectRatio: "1/1" }}
//       >
//         {!isVisible || loading ? (
//           <div className="animate-spin h-5 w-5 border-2 border-red-400 border-t-transparent rounded-full" />
//         ) : previewUrl ? (
//           <iframe
//             src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
//             className="w-full h-full pointer-events-none"
//             title={file.name}
//           />
//         ) : (
//           <FileIcon fileName={file.name} size={36} />
//         )}
//       </div>
//     );
//   }

//   // --- DOCX ---
//   if (
//     mime ===
//     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//   ) {
//     return (
//       <div
//         className="w-full rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center gap-2"
//         style={{ aspectRatio: "1/1" }}
//       >
//         <FileText size={32} className="text-blue-500" />
//         <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
//           Word Document
//         </span>
//       </div>
//     );
//   }

//   // --- Fallback ---
//   return (
//     <div
//       className="w-full rounded-xl bg-bg-main border border-border flex items-center justify-center"
//       style={{ aspectRatio: "1/1" }}
//     >
//       <FileIcon fileName={file.name} size={36} />
//     </div>
//   );
// };

// // --- Main FileCard ---
// const FileCard = ({ file, onAction, onPreview, onStarToggle }) => {
//   const fileInputRef = useRef(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isStarred, setIsStarred] = useState(file.is_starred || false);
//   const [isStarring, setIsStarring] = useState(false);

//   const handleStarToggle = async (e) => {
//     e.stopPropagation();
//     if (isStarring) return;
//     setIsStarring(true);
//     setIsStarred((prev) => !prev);
//     try {
//       await API.post("/files/stars/toggle", { fileId: file.id });
//       onStarToggle?.();
//     } catch (err) {
//       setIsStarred((prev) => !prev);
//       console.error("Star toggle failed:", err);
//     } finally {
//       setIsStarring(false);
//     }
//   };

//   const handleReupload = async (e) => {
//     const selectedFile = e.target.files[0];
//     if (!selectedFile) return;
//     setIsUploading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", selectedFile);
//       await API.post(`/files/upload/${file.id}`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       onAction?.(file, "reupload_done");
//     } catch (err) {
//       console.error("Re-upload failed:", err);
//     } finally {
//       setIsUploading(false);
//       e.target.value = "";
//     }
//   };

//   const menuItems = [
//     {
//       label: "Download",
//       icon: Download,
//       onClick: () => onAction?.(file, "download"),
//     },
//     {
//       label: "Update File",
//       icon: RefreshCw,
//       onClick: () => fileInputRef.current?.click(),
//     },
//     {
//       label: "Version History",
//       icon: History,
//       onClick: () => onAction?.(file, "versions"),
//     },
//     {
//       label: "Rename",
//       icon: Pencil,
//       onClick: () => onAction?.(file, "rename"),
//     },
//     { label: "Share", icon: Share2, onClick: () => onAction?.(file, "share") },
//     {
//       label: "Delete",
//       icon: Trash2,
//       onClick: () => onAction?.(file, "delete"),
//       variant: "danger",
//     },
//   ];

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       transition={{ duration: 0.2 }}
//       className="relative"
//       onClick={() => onPreview?.(file)}
//     >
//       {/* Hidden file input */}
//       <input
//         ref={fileInputRef}
//         type="file"
//         className="hidden"
//         onChange={handleReupload}
//       />

//       <Card
//         className={`
//         group p-2 cursor-pointer hover:shadow-xl
//         transition-all border-border/60
//         ${isMenuOpen ? "z-20" : ""}
//         ${isUploading ? "opacity-60" : ""}
//       `}
//       >
//         {/* Upload spinner overlay */}
//         {isUploading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-3xl z-10">
//             <div className="animate-spin h-6 w-6 border-4 border-brand-blue border-t-transparent rounded-full" />
//           </div>
//         )}

//         {/* FILE PREVIEW (replaces icon) */}
//         <div className=" relative">
//           <FilePreview file={file} />

//           {/* Star button — top left of preview */}
//           <button
//             onClick={handleStarToggle}
//             disabled={isStarring}
//             className="absolute top-2 left-2 p-1.5 bg-surface/80 rounded-lg hover:bg-yellow-50 transition-colors"
//             title={isStarred ? "Remove from starred" : "Add to starred"}
//           >
//             <Star
//               size={12}
//               className={`transition-colors ${
//                 isStarred
//                   ? "fill-yellow-400 text-yellow-400"
//                   : "text-text-secondary/60 hover:text-yellow-400"
//               }`}
//             />
//           </button>

//           {/* MoreVertical — top right of preview */}
//           <div className="absolute top-2 right-2">
//             <Button
//               variant="ghost"
//               size="sm"
//               className={`
//   p-1 bg-surface/80 rounded-lg
//   opacity-100 md:opacity-0 md:group-hover:opacity-100
//   transition-opacity
// `}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setIsMenuOpen((prev) => !prev);
//               }}
//             >
//               <MoreVertical size={14} />
//             </Button>

//             <ContextMenu
//               isOpen={isMenuOpen}
//               onClose={() => setIsMenuOpen(false)}
//               items={menuItems}
//             />
//           </div>
//         </div>

//         {/* FILE NAME + SIZE */}
//         {/* FILE NAME + SIZE — fixed height strip */}
//         <div className="h-10 flex flex-col justify-center px-1">
//           <h4
//             className="text-sm font-bold text-text-primary truncate"
//             title={file.name}
//           >
//             {file.name}
//           </h4>
//           <span className="text-[10px] text-text-secondary uppercase font-semibold">
//             {file.size_bytes
//               ? (file.size_bytes / 1024).toFixed(1) + " KB"
//               : "—"}
//           </span>
//         </div>
//       </Card>
//     </motion.div>
//   );
// };

// export default FileCard;

// import React, { useState, useRef } from "react";
// import {
//   MoreVertical,
//   Star,
//   Download,
//   Pencil,
//   Trash2,
//   Share2,
//   History,
//   RefreshCw,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import Card from "./Card";
// import FileIcon from "./FileIcon";
// import Button from "./Button";
// import ContextMenu from "./ContextMenu";
// import API from "../../api.jsx";

// const FileCard = ({ file, onAction, onPreview, onStarToggle }) => {
//   const fileInputRef = useRef(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isStarred, setIsStarred] = useState(file.is_starred || false);
//   const [isStarring, setIsStarring] = useState(false);

//   // --- Star toggle handler ---
//   const handleStarToggle = async (e) => {
//     e.stopPropagation(); // prevent file preview
//     if (isStarring) return;
//     setIsStarring(true);

//     // Optimistic update
//     setIsStarred((prev) => !prev);

//     try {
//       await API.post("/files/stars/toggle", {
//         fileId: file.id,
//       });
//       onStarToggle?.();
//     } catch (err) {
//       // Revert on error
//       setIsStarred((prev) => !prev);
//       console.error("Star toggle failed:", err);
//     } finally {
//       setIsStarring(false);
//     }
//   };

//   const handleReupload = async (e) => {
//     const selectedFile = e.target.files[0];
//     if (!selectedFile) return;
//     setIsUploading(true);

//     try {
//       const formData = new FormData();
//       formData.append("file", selectedFile);

//       await API.post(`/files/upload/${file.id}`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       onAction?.(file, "reupload_done");
//     } catch (err) {
//       console.error("Re-upload failed:", err);
//     } finally {
//       setIsUploading(false);
//       // Reset input so same file can be selected again
//       e.target.value = "";
//     }
//   };

//   const menuItems = [
//     {
//       label: "Download",
//       icon: Download,
//       onClick: () => onAction?.(file, "download"),
//     },
//     {
//       label: "Update File",
//       icon: RefreshCw,
//       onClick: () => fileInputRef.current?.click(),
//     },
//     {
//       label: "Version History",
//       icon: History,
//       onClick: () => onAction?.(file, "versions"),
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
//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       transition={{ duration: 0.2 }}
//       className="relative"
//       onClick={() => onPreview?.(file)}
//     >
//       {/* Hidden file input for re-upload */}
//       <input
//         ref={fileInputRef}
//         type="file"
//         className="hidden"
//         onChange={handleReupload}
//       />

//       <Card
//         className={`group p-3 cursor-pointer hover:shadow-xl transition-all border-border/60 ${isMenuOpen ? "z-20" : ""} ${isUploading ? "opacity-60" : ""}`}
//       >
//         {/* uploading indicator */}
//         {isUploading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-3xl z-10">
//             <div className="animate-spin h-6 w-6 border-4 border-brand-blue border-t-transparent rounded-full" />
//           </div>
//         )}
//         <div className="flex items-start justify-between mb-4">
//           {/* File Icon */}
//           <div className="p-3 bg-bg-main rounded-2xl group-hover:scale-110 transition-transform">
//             <FileIcon fileName={file.name} size={32} />
//           </div>

//           {/* MoreVertical trigger */}
//           <div className="relative">
//             <Button
//               variant="ghost"
//               size="sm"
//               className="p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setIsMenuOpen((prev) => !prev);
//               }}
//             >
//               <MoreVertical size={16} />
//             </Button>

//             <ContextMenu
//               isOpen={isMenuOpen}
//               onClose={() => setIsMenuOpen(false)}
//               items={menuItems}
//             />
//           </div>
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

//             {/* STAR BUTTON */}
//             <button
//               onClick={handleStarToggle}
//               disabled={isStarring}
//               className="p-1 rounded-lg hover:bg-yellow-50 transition-colors"
//               title={isStarred ? "Remove from starred" : "Add to starred"}
//             >
//               <Star
//                 size={13}
//                 className={`transition-colors ${
//                   isStarred
//                     ? "fill-yellow-400 text-yellow-400"
//                     : "text-text-secondary/40 hover:text-yellow-400"
//                 }`}
//               />
//             </button>
//           </div>
//         </div>
//       </Card>
//     </motion.div>
//   );
// };

// export default FileCard;

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
