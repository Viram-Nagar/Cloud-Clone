import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Star,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  Share2,
  History,
  RefreshCw,
} from "lucide-react";
import FileIcon from "./FileIcon";
import ContextMenu from "./ContextMenu";
import { useNavigate } from "react-router-dom";
import API from "../../api.jsx";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const FileRow = ({
  file,
  onAction,
  onStarToggle,
  currentFolderId,
  folderName,
  fullPath,
  sharedRole,
  source = "dashboard",
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(file.is_starred || false);
  const navigate = useNavigate();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `file-${file.id}`,
      data: { type: "file", id: file.id, name: file.name },
    });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  useEffect(() => {
    setIsStarred(file.is_starred || false);
  }, [file.is_starred]);

  const handleStarToggle = async (e) => {
    e.stopPropagation();
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    try {
      await API.post("/files/stars/toggle", { fileId: file.id });
      toast(newStarred ? "⭐ Added to Starred" : "Removed from Starred", {
        type: newStarred ? "success" : "info",
      });
      onStarToggle?.(file);
    } catch {
      setIsStarred((prev) => !prev);
      toast.error("Failed to update star");
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
      onClick: () => onAction?.(file, "reupload"),
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      ref={setNodeRef}
      style={dragStyle}
      className={`relative flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-bg-main transition-colors cursor-grab active:cursor-grabbing ${isDragging ? "ring-2 ring-brand-blue/40 rounded-xl" : ""}`}
      onClick={() => {
        if (!isDragging) {
          navigate(
            `/preview/${file.id}?folderId=${currentFolderId ?? ""}&folderName=${encodeURIComponent(folderName ?? "My Drive")}&fileName=${encodeURIComponent(file.name)}&mimeType=${encodeURIComponent(file.mime_type || "")}&sizeBytes=${file.size_bytes || 0}&path=${encodeURIComponent(JSON.stringify(fullPath ?? []))}&source=${source}`,
          );
        }
      }}
    >
      <div className="shrink-0" {...listeners} {...attributes}>
        <FileIcon fileName={file.name} size={18} />
      </div>

      <div className="flex-1 min-w-0" {...listeners} {...attributes}>
        <p className="text-sm font-bold text-text-primary truncate">
          {file.name}
        </p>
      </div>

      <span className="text-xs text-text-secondary shrink-0 w-20 text-right hidden sm:block">
        {formatSize(file.size_bytes)}
      </span>

      <span className="text-xs text-text-secondary shrink-0 w-28 text-right hidden md:block">
        {formatDate(file.updated_at)}
      </span>

      <button
        onClick={handleStarToggle}
        onPointerDown={(e) => e.stopPropagation()}
        className="shrink-0 p-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
      >
        <Star
          size={13}
          className={
            isStarred
              ? "fill-yellow-400 text-yellow-400"
              : "text-text-secondary/40 hover:text-yellow-400"
          }
        />
      </button>

      <div
        className="relative shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((p) => !p);
          }}
          className="p-1.5 rounded-lg hover:bg-border transition-colors"
        >
          <MoreVertical size={14} className="text-text-secondary" />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 bottom-full mb-1 z-50">
            <ContextMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              items={menuItems}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FolderRow = ({ folder, onNavigate, onAction, onStarToggle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(folder.is_starred || false);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `folder-${folder.id}`,
    data: { type: "folder", id: folder.id, name: folder.name },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `droppable-folder-${folder.id}`,
    data: { type: "folder", folderId: folder.id },
  });

  const setRef = (node) => {
    setDragRef(node);
    setDropRef(node);
  };

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  useEffect(() => {
    setIsStarred(folder.is_starred || false);
  }, [folder.is_starred]);

  const handleStarToggle = async (e) => {
    e.stopPropagation();
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    try {
      await API.post("/files/stars/toggle", { folderId: folder.id });
      toast(newStarred ? "⭐ Added to Starred" : "Removed from Starred", {
        type: newStarred ? "success" : "info",
      });
      onStarToggle?.(folder);
    } catch {
      setIsStarred((prev) => !prev);
      toast.error("Failed to update star");
    }
  };

  const menuItems = [
    {
      label: "Rename",
      icon: Pencil,
      onClick: () => onAction?.(folder, "rename"),
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: () => onAction?.(folder, "delete"),
      variant: "danger",
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      ref={setRef}
      style={dragStyle}
      onClick={() => {
        if (!isDragging) onNavigate?.(folder.id, folder.name);
      }}
      className={`relative flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 transition-colors cursor-grab active:cursor-grabbing
        ${isOver ? "bg-brand-blue/5 ring-2 ring-brand-blue/30 rounded-xl" : "hover:bg-bg-main"}
        ${isDragging ? "ring-2 ring-brand-blue/40 rounded-xl" : ""}
      `}
    >
      <div
        className={`p-1.5 rounded-lg shrink-0 ${isOver ? "bg-brand-blue/20" : "bg-brand-blue/10"}`}
        {...listeners}
        {...attributes}
      >
        <Folder
          size={18}
          className={
            isOver
              ? "text-brand-blue fill-brand-blue/40"
              : "text-brand-blue fill-brand-blue/20"
          }
        />
      </div>

      <div className="flex-1 min-w-0" {...listeners} {...attributes}>
        <p
          className={`text-sm font-bold truncate ${isOver ? "text-brand-blue" : "text-text-primary"}`}
        >
          {folder.name}
        </p>
        {isOver && (
          <p className="text-[10px] text-brand-blue font-bold">Move here</p>
        )}
      </div>

      <span className="text-xs text-text-secondary shrink-0 w-20 text-right hidden sm:block">
        —
      </span>

      <span className="text-xs text-text-secondary shrink-0 w-28 text-right hidden md:block">
        {formatDate(folder.updated_at)}
      </span>

      <button
        onClick={handleStarToggle}
        onPointerDown={(e) => e.stopPropagation()}
        className="shrink-0 p-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
      >
        <Star
          size={13}
          className={
            isStarred
              ? "fill-yellow-400 text-yellow-400"
              : "text-text-secondary/40 hover:text-yellow-400"
          }
        />
      </button>

      <div
        className="relative shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((p) => !p);
          }}
          className="p-1.5 rounded-lg hover:bg-border transition-colors"
        >
          <MoreVertical size={14} className="text-text-secondary" />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 bottom-full mb-1 z-50">
            <ContextMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              items={menuItems}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FileListView = ({
  files = [],
  folders = [],
  onFileAction,
  onFolderAction,
  onNavigate,
  onStarToggle,
  currentFolderId,
  folderName,
  fullPath,
  source = "dashboard",
}) => {
  return (
    <div className="bg-surface border border-border rounded-3xl shadow-sm">
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-bg-main rounded-t-3xl">
        <div className="w-7 shrink-0" />
        <span className="flex-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          Name
        </span>
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider w-20 text-right hidden sm:block">
          Size
        </span>
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider w-28 text-right hidden md:block">
          Modified
        </span>
        <div className="w-7 shrink-0" />
        <div className="w-7 shrink-0" />
      </div>

      <AnimatePresence mode="popLayout">
        {folders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            onNavigate={onNavigate}
            onAction={onFolderAction}
            onStarToggle={onStarToggle}
          />
        ))}
        {files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            onAction={onFileAction}
            onStarToggle={onStarToggle}
            currentFolderId={currentFolderId}
            folderName={folderName}
            fullPath={fullPath}
            source={source}
          />
        ))}
      </AnimatePresence>

      {files.length === 0 && folders.length === 0 && (
        <div className="text-center py-12 text-text-secondary text-sm">
          This folder is empty.
        </div>
      )}
    </div>
  );
};

export default FileListView;
