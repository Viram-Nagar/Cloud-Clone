import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api.jsx";
import downloadFile from "../util/DownloadFile.jsx";
import FileCard from "../components/ui/FileCard";
import FolderCard from "../components/ui/FolderCard";
import FilePreviewModal from "../components/ui/FilePreviewModal";
import ShareModal from "../components/ui/ShareModal";
import VersionModal from "../components/ui/VersionModal";

const Starred = () => {
  const [starredItems, setStarredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  useEffect(() => {
    fetchStarredItems();
  }, []);

  const fetchStarredItems = async () => {
    setLoading(true);
    try {
      const res = await API.get("/files/stars");
      setStarredItems(res.data.starredItems || []);
    } catch (err) {
      console.error("Failed to fetch starred items:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Unstar handler ---
  const handleUnstar = async (item) => {
    try {
      await API.post("/files/stars/toggle", {
        fileId: item.type === "file" ? item.id : undefined,
        folderId: item.type === "folder" ? item.id : undefined,
      });
      // Remove from list immediately (optimistic update)
      setStarredItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error("Unstar failed:", err);
    }
  };

  // --- File actions ---
  const handleFileAction = async (file, action) => {
    if (action === "download") {
      await downloadFile(file);
    }

    if (action === "delete") {
      try {
        await API.delete(`/files/${file.id}`);
        setStarredItems((prev) => prev.filter((i) => i.id !== file.id));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    if (action === "share") {
      setShareTarget({ id: file.id, name: file.name, type: "file" });
      setIsShareModalOpen(true);
    }

    if (action === "rename") {
      setRenameTarget({ ...file, type: "file" });
      setNewName(file.name);
      setIsRenameModalOpen(true);
    }

    // Add to handleFileAction in SearchPage.jsx and Starred.jsx
    if (action === "versions") {
      setVersionTarget(file);
      setIsVersionModalOpen(true);
    }
  };

  // --- Folder actions ---
  const handleFolderAction = async (folder, action) => {
    if (action === "delete") {
      try {
        await API.delete(`/files/folders/${folder.id}`);
        setStarredItems((prev) => prev.filter((i) => i.id !== folder.id));
      } catch (err) {
        console.error("Folder delete failed:", err);
      }
    }

    if (action === "rename") {
      setRenameTarget({ ...folder, type: "folder" });
      setNewName(folder.name);
      setIsRenameModalOpen(true);
    }
  };

  const files = starredItems.filter((i) => i.type === "file");
  const folders = starredItems.filter((i) => i.type === "folder");

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsRenaming(true);
    try {
      if (renameTarget.type === "folder") {
        await API.patch(`/files/folders/${renameTarget.id}`, {
          newName: newName.trim(),
        });
      } else {
        await API.patch(`/files/${renameTarget.id}`, {
          newName: newName.trim(),
        });
      }
      setIsRenameModalOpen(false);
      setRenameTarget(null);
      setNewName("");
      fetchStarredItems();
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-50 rounded-xl">
            <Star size={22} className="text-yellow-500 fill-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Starred</h2>
            <p className="text-xs text-text-secondary">
              {starredItems.length} starred item
              {starredItems.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
          <p className="text-text-secondary font-medium">
            Loading starred items...
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && starredItems.length === 0 && (
        <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-bg-main rounded-2xl border border-border">
              <Star size={32} className="text-text-secondary" />
            </div>
            <p className="text-text-primary font-bold">No starred items yet</p>
            <p className="text-sm text-text-secondary">
              Star files and folders to find them quickly here.
            </p>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {/* CONTENT */}
      {!loading && starredItems.length > 0 && (
        <div className="space-y-10">
          {/* STARRED FOLDERS */}
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
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onNavigate={() => {}}
                      onAction={handleFolderAction}
                      onStarToggle={() => handleUnstar(folder)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {/* STARRED FILES */}
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
                    <FileCard
                      key={file.id}
                      file={file}
                      onPreview={(f) => setPreviewFile(f)}
                      onAction={handleFileAction}
                      onStarToggle={() => handleUnstar(file)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTarget(null);
        }}
        resource={shareTarget}
      />

      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => {
          setIsVersionModalOpen(false);
          setVersionTarget(null);
        }}
        file={versionTarget}
      />

      {/* RENAME MODAL */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setRenameTarget(null);
          setNewName("");
        }}
        title={`Rename ${renameTarget?.type === "folder" ? "Folder" : "File"}`}
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

export default Starred;
