import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api.jsx";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import FileIcon from "../components/ui/FileIcon";
import { Folder } from "lucide-react";

// --- Format file size ---
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// --- Format date ---
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Trash = () => {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEmptyTrashModalOpen, setIsEmptyTrashModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Fetch trash ---
  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await API.get("/files/trash");
      setTrashItems(res.data.trash || []);
    } catch (err) {
      console.error("Failed to fetch trash:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 3b: Restore item ---
  const handleRestore = async (item) => {
    try {
      await API.post(`/files/${item.id}/restore`, { type: item.type });
      // Remove from trash list immediately
      setTrashItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`${item.name} restored successfully`);
    } catch (err) {
      console.error("Restore failed:", err);
      toast.error("Failed to restore item");
    }
  };

  // --- 3c: Permanent delete (single) ---
  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      if (deleteTarget.type === "file") {
        await API.delete(`/files/${deleteTarget.id}/permanent`);
      } else {
        // For folders — soft delete is already done
        // permanently delete folder from DB directly
        await API.delete(`/files/folders/${deleteTarget.id}/permanent`);
      }
      setTrashItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      toast.success("Permanently deleted");
    } catch (err) {
      console.error("Permanent delete failed:", err);
      toast.error("Failed to permanently delete");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3d: Empty trash (all) ---
  const handleEmptyTrash = async () => {
    setIsProcessing(true);
    try {
      // Delete all files permanently
      const files = trashItems.filter((i) => i.type === "file");
      const folders = trashItems.filter((i) => i.type === "folder");

      await Promise.all([
        ...files.map((f) => API.delete(`/files/${f.id}/permanent`)),
        ...folders.map((f) => API.delete(`/files/folders/${f.id}/permanent`)),
      ]);

      setTrashItems([]);
      setIsEmptyTrashModalOpen(false);
      toast.success("Trash emptied successfully");
    } catch (err) {
      console.error("Empty trash failed:", err);
      toast.error("Failed to empty trash");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <Trash2 size={22} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Trash</h2>
            <p className="text-xs text-text-secondary">
              {trashItems.length} item{trashItems.length !== 1 ? "s" : ""} —
              items are permanently deleted after 30 days
            </p>
          </div>
        </div>

        {/* Empty Trash Button */}
        {trashItems.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setIsEmptyTrashModalOpen(true)}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Empty Trash</span>
          </Button>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
          <p className="text-text-secondary font-medium">Loading trash...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && trashItems.length === 0 && (
        <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-bg-main rounded-2xl border border-border">
              <Trash2 size={32} className="text-text-secondary" />
            </div>
            <p className="text-text-primary font-bold">Trash is empty</p>
            <p className="text-sm text-text-secondary">
              Deleted files and folders will appear here.
            </p>
          </div>
        </div>
      )}

      {/* TRASH ITEMS LIST */}
      {!loading && trashItems.length > 0 && (
        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <AnimatePresence>
            {trashItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-b-0 hover:bg-bg-main transition-colors"
              >
                {/* Icon */}
                <div className="shrink-0">
                  {item.type === "folder" ? (
                    <div className="p-2.5 bg-brand-blue/10 rounded-xl">
                      <Folder size={20} className="text-brand-blue" />
                    </div>
                  ) : (
                    <FileIcon fileName={item.name} size={20} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-text-secondary font-medium capitalize">
                      {item.type}
                    </span>
                    {item.size_bytes > 0 && (
                      <>
                        <span className="text-text-secondary/40 text-[10px]">
                          ·
                        </span>
                        <span className="text-[10px] text-text-secondary font-medium">
                          {formatSize(item.size_bytes)}
                        </span>
                      </>
                    )}
                    <span className="text-text-secondary/40 text-[10px]">
                      ·
                    </span>
                    <span className="text-[10px] text-text-secondary font-medium">
                      Deleted {formatDate(item.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Restore */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleRestore(item)}
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline text-xs">Restore</span>
                  </Button>

                  {/* Permanent Delete */}
                  {item.type === "file" && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setDeleteTarget(item);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <X size={13} />
                      <span className="hidden sm:inline text-xs">Delete</span>
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* SINGLE ITEM DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        title="Permanently Delete?"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-text-primary">
                This action cannot be undone
              </p>
              <p className="text-sm text-text-secondary mt-1">
                <span className="font-bold text-text-primary">
                  "{deleteTarget?.name}"
                </span>{" "}
                will be permanently deleted and storage will be freed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handlePermanentDelete}
              isLoading={isProcessing}
              loadingText="Deleting..."
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>

      {/* EMPTY TRASH CONFIRMATION MODAL */}
      <Modal
        isOpen={isEmptyTrashModalOpen}
        onClose={() => setIsEmptyTrashModalOpen(false)}
        title="Empty Trash?"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-text-primary">
                This action cannot be undone
              </p>
              <p className="text-sm text-text-secondary mt-1">
                All{" "}
                <span className="font-bold text-text-primary">
                  {trashItems.length} item{trashItems.length !== 1 ? "s" : ""}
                </span>{" "}
                in trash will be permanently deleted and storage will be freed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsEmptyTrashModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleEmptyTrash}
              isLoading={isProcessing}
              loadingText="Emptying..."
            >
              Empty Trash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Trash;
