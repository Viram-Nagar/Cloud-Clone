import React from "react";
import { MoreVertical, Star } from "lucide-react";
import { motion } from "framer-motion"; // Adding Framer Motion
import Card from "./Card";
import FileIcon from "./FileIcon";
import Button from "./Button";

const FileCard = ({ file, onAction, onPreview }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onPreview?.(file)}
    >
      <Card className="group p-3 cursor-pointer hover:shadow-xl transition-all border-border/60 ">
        <div className="flex items-start justify-between mb-4">
          {/* File Icon based on MimeType */}
          <div className="p-3 bg-bg-main rounded-2xl group-hover:scale-110 transition-transform">
            <FileIcon fileName={file.name} size={32} />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
          </Button>
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
            {file.isStarred && (
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FileCard;
