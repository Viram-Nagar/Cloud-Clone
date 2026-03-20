import React, { useState, useEffect } from "react";
import API from "../api.jsx";
import FileCard from "../components/ui/FileCard";
import FolderCard from "../components/ui/FolderCard";
import FilePreviewModal from "../components/ui/FilePreviewModal";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

import downloadFile from "../util/DownloadFile.jsx";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ShareModal from "../components/ui/ShareModal";

// States:

const SharedWithMe = () => {
  const [sharedItems, setSharedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);

  useEffect(() => {
    fetchSharedItems();
  }, []);

  const fetchSharedItems = async () => {
    setLoading(true);
    try {
      const res = await API.get("/files/shared-with-me");
      setSharedItems(res.data.sharedItems || []);
    } catch (err) {
      console.error("Failed to fetch shared items:", err);
    } finally {
      setLoading(false);
    }
  };

  const files = sharedItems.filter((i) => i.type === "file");
  const folders = sharedItems.filter((i) => i.type === "folder");

  const handleFileAction = async (file, action) => {
    if (action === "download") {
      await downloadFile(file);
    }
    if (action === "rename") {
      setRenameTarget({ ...file, type: "file" });
      setNewName(file.name);
      setIsRenameModalOpen(true);
    }
    if (action === "share") {
      setShareTarget({ id: file.id, name: file.name, type: "file" });
      setIsShareModalOpen(true);
    }
    if (action === "delete") {
      try {
        await API.delete(`/files/${file.id}`);
        fetchSharedItems();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsRenaming(true);
    try {
      try {
        await API.patch(`/files/${renameTarget.id}`, {
          newName: newName.trim(),
        });
      } catch (err) {
        if (err.response?.status === 404) {
          await API.patch(`/files/shared/${renameTarget.id}/rename`, {
            newName: newName.trim(),
          });
        } else throw err;
      }
      setIsRenameModalOpen(false);
      setRenameTarget(null);
      setNewName("");
      fetchSharedItems();
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 bg-surface p-4 rounded-3xl border border-border shadow-sm">
        <div className="p-2.5 bg-brand-blue/10 rounded-xl">
          <Users size={22} className="text-brand-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Shared with me
          </h2>
          <p className="text-xs text-text-secondary">
            Files and folders others have shared with you
          </p>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
          <p className="text-text-secondary font-medium">
            Loading shared items...
          </p>
        </div>
      ) : sharedItems.length === 0 ? (
        /* EMPTY STATE */
        <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-bg-main rounded-2xl border border-border">
              <Users size={32} className="text-text-secondary" />
            </div>
            <p className="text-text-primary font-bold">
              Nothing shared with you yet
            </p>
            <p className="text-sm text-text-secondary">
              When someone shares a file or folder with you, it will appear
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* SHARED FOLDERS */}
          {folders.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
                Folders
              </h3>
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {folders.map((folder) => (
                    <div key={folder.id} className="space-y-1">
                      <FolderCard
                        folder={folder}
                        onNavigate={() => {}} // read-only for now
                        onAction={() => {}}
                      />
                      {/* Shared by badge */}
                      <p className="text-[10px] text-text-secondary px-1 truncate">
                        Shared by{" "}
                        <span className="font-bold text-text-primary">
                          {folder.shared_by_name || folder.shared_by_email}
                        </span>
                        {" · "}
                        <span className="capitalize">{folder.role}</span>
                      </p>
                    </div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {/* SHARED FILES */}
          {files.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
                Files
              </h3>
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {files.map((file) => (
                    <div key={file.id} className="space-y-1">
                      <FileCard
                        file={file}
                        onAction={handleFileAction}
                        sharedRole={file.role}
                        isShared={true}
                        currentFolderId={file.folder_id ?? null}
                        folderName="Shared with me"
                      />
                      {/* Shared by badge */}
                      <p className="text-[10px] text-text-secondary px-1 truncate">
                        By{" "}
                        <span className="font-bold text-text-primary">
                          {file.shared_by_name || file.shared_by_email}
                        </span>
                        {" · "}
                        <span className="capitalize">{file.role}</span>
                      </p>
                    </div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}
        </div>
      )}

      {/* FILE PREVIEW */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTarget(null);
        }}
        resource={shareTarget}
      />

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setRenameTarget(null);
          setNewName("");
        }}
        title="Rename File"
      >
        <form onSubmit={handleRename} className="space-y-6">
          <Input
            label="New Name"
            placeholder={renameTarget?.name}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            required
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsRenameModalOpen(false);
                setRenameTarget(null);
                setNewName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isRenaming}
              loadingText="Renaming..."
            >
              Rename
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SharedWithMe;
