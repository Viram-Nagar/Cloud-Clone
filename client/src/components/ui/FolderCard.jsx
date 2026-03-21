import React, { useState, useEffect } from "react";
import { Folder, MoreVertical, Pencil, Trash2, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Card from "./Card";
import Button from "./Button";
import ContextMenu from "./ContextMenu";
import API from "../../api.jsx";
import { toast } from "react-toastify";

const FolderCard = ({ folder, onNavigate, onAction, onStarToggle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(folder.is_starred || false);
  const [isStarring, setIsStarring] = useState(false);

  useEffect(() => {
    setIsStarred(folder.is_starred || false);
  }, [folder.is_starred]);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `folder-${folder.id}`,
    data: {
      type: "folder",
      id: folder.id,
      name: folder.name,
    },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `droppable-folder-${folder.id}`,
    data: {
      type: "folder",
      folderId: folder.id,
    },
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

  const handleStarToggle = async (e) => {
    e.stopPropagation();
    if (isStarring) return;
    setIsStarring(true);
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    try {
      await API.post("/files/stars/toggle", { folderId: folder.id });
      toast(newStarred ? "⭐ Added to Starred" : "Removed from Starred", {
        type: newStarred ? "success" : "info",
      });
      onStarToggle?.(folder);
    } catch (err) {
      setIsStarred((prev) => !prev);
      toast.error("Failed to update star");
      console.error("Star toggle failed:", err);
    } finally {
      setIsStarring(false);
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      ref={setRef}
      style={dragStyle}
      className="cursor-pointer relative"
      onClick={() => {
        if (!isDragging) onNavigate?.(folder.id, folder.name);
      }}
    >
      <Card
        className={`
          group hover:shadow-xl transition-all border-2
          bg-surface
          ${isMenuOpen ? "z-20" : ""}
          ${isDragging ? "opacity-40 shadow-2xl" : ""}
          ${
            isOver
              ? "border-brand-blue bg-brand-blue/5 scale-[1.02]" // ← drop highlight
              : "border-border/60 hover:border-brand-blue/30"
          }
        `}
      >
        <div className="relative" {...listeners} {...attributes}>
          <div
            className={`
              flex items-center justify-center rounded-2xl transition-colors
              ${
                isOver
                  ? "bg-brand-blue/20"
                  : "bg-brand-blue/5 group-hover:bg-brand-blue/10"
              }
            `}
            style={{ aspectRatio: "1/1" }}
          >
            <Folder
              size={64}
              className={`transition-colors ${
                isOver
                  ? "text-brand-blue fill-brand-blue/50"
                  : "text-brand-blue fill-brand-blue/30"
              }`}
            />
          </div>

          {isOver && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
              <span className="text-xs font-bold text-brand-blue bg-surface/90 px-2 py-1 rounded-lg">
                Move here
              </span>
            </div>
          )}

          <button
            onClick={handleStarToggle}
            disabled={isStarring}
            className="absolute top-2 left-2 p-1.5 bg-surface/80 rounded-lg hover:bg-yellow-50 transition-colors opacity-100"
            title={isStarred ? "Remove from starred" : "Add to starred"}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Star
              size={13}
              className={`transition-colors ${
                isStarred
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-text-secondary/50 hover:text-yellow-400"
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

        <div className="h-10 flex items-center justify-center px-1">
          <h4
            className={`text-sm font-bold truncate text-center w-full ${
              isOver ? "text-brand-blue" : "text-text-primary"
            }`}
            title={folder.name}
          >
            {folder.name}
          </h4>
        </div>
      </Card>
    </motion.div>
  );
};

export default FolderCard;
