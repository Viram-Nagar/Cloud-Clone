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
      onStarToggle?.(file);
    } catch (err) {
      setIsStarred((prev) => !prev);
      toast.error("Failed to update star");
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
      e.target.value = "";
    }
  };

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
      ref={setNodeRef}
      style={dragStyle}
      className="relative"
      onClick={() => {
        if (!isDragging) {
          console.log("fullPath being sent:", fullPath);

          navigate(
            `/preview/${file.id}?folderId=${currentFolderId ?? ""}&folderName=${encodeURIComponent(folderName ?? "My Drive")}&fileName=${encodeURIComponent(file.name)}&mimeType=${encodeURIComponent(file.mime_type || "")}&sizeBytes=${file.size_bytes || 0}&path=${encodeURIComponent(JSON.stringify(fullPath ?? []))}&source=${source}`,
          );
        }
      }}
    >
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
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-3xl z-10">
            <div className="animate-spin h-6 w-6 border-4 border-brand-blue border-t-transparent rounded-full" />
          </div>
        )}

        <div className="relative" {...listeners} {...attributes}>
          <FilePreview file={file} />

          <button
            onClick={handleStarToggle}
            disabled={isStarring}
            className="absolute top-2 left-2 p-1.5 bg-surface/80 rounded-lg hover:bg-yellow-50 transition-colors opacity-100"
            title={isStarred ? "Remove from starred" : "Add to starred"}
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

          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 bg-surface/80 rounded-lg opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
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
