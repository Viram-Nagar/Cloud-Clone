import React, { useState, useEffect } from "react";
import { History, Download, Clock, HardDrive, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api.jsx";
import Modal from "./Modal";
import Button from "./Button";
import FileIcon from "./FileIcon";

// --- Format size ---
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const VersionModal = ({ isOpen, onClose, file }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);

  useEffect(() => {
    if (!isOpen || !file) return;
    fetchVersions();
    return () => {
      setVersions([]);
      setCurrentVersion(null);
    };
  }, [isOpen, file]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/files/${file.id}/versions`);
      setVersions(res.data.versions || []);
      setCurrentVersion(file.version_number || 1);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!file) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Version History"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-bg-main rounded-2xl border border-border">
          <FileIcon fileName={file.name} size={20} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {file.name}
            </p>
            <p className="text-xs text-text-secondary">
              Current version: v{currentVersion || 1}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-brand-blue border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && versions.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <div className="flex justify-center">
              <div className="p-4 bg-bg-main rounded-2xl border border-border">
                <History size={28} className="text-text-secondary" />
              </div>
            </div>
            <p className="text-sm font-bold text-text-primary">
              No previous versions
            </p>
            <p className="text-xs text-text-secondary">
              Previous versions are saved automatically when you re-upload this
              file.
            </p>
          </div>
        )}

        {!loading && versions.length > 0 && (
          <div className="space-y-3">
            {/* Header */}
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">
              {versions.length} previous version
              {versions.length !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-3 p-3 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl">
              <div className="p-2 bg-brand-blue/10 rounded-xl shrink-0">
                <FileIcon fileName={file.name} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-text-primary">
                    v{currentVersion} — Current
                  </p>
                  <span className="text-[10px] font-bold bg-brand-blue text-white px-2 py-0.5 rounded-full">
                    LATEST
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  {formatSize(file.size_bytes)}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {versions.map((version, index) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-bg-main border border-border rounded-2xl hover:border-brand-blue/30 transition-colors"
                >
                  <div className="p-2 bg-surface rounded-xl border border-border shrink-0">
                    <History size={16} className="text-text-secondary" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-bold text-text-primary">
                      v{version.version_number}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-text-secondary font-medium">
                        <HardDrive size={10} />
                        {formatSize(version.size_bytes)}
                      </span>
                      <span className="text-text-secondary/40 text-[10px]">
                        ·
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-text-secondary font-medium">
                        <Clock size={10} />
                        {formatDate(version.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <p className="text-[11px] text-text-secondary leading-relaxed px-1">
          Versions are saved automatically each time you re-upload this file.
          Previous versions are kept for reference.
        </p>
      </div>
    </Modal>
  );
};

export default VersionModal;
