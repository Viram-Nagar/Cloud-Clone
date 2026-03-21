import { toast } from "react-toastify";
import FileIcon from "../components/ui/FileIcon";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import React, { useState, useEffect } from "react";
import API from "../api.jsx";
import UploadZone from "../components/ui/UploadZone";
import FileCard from "../components/ui/FileCard";
import FolderCard from "../components/ui/FolderCard";
import ShareModal from "../components/ui/ShareModal";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import VersionModal from "../components/ui/VersionModal";
import downloadFile from "../util/DownloadFile.jsx";

import Button from "../components/ui/Button";
import useViewPreference from "../hooks/useViewPreference";
import ViewToggle from "../components/ui/ViewToggle";
import SortDropdown from "../components/ui/SortDropdown";
import FileListView from "../components/ui/FileListView";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Upload, Grid, List as ListIcon, Plus } from "lucide-react";
const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { viewMode, toggleView } = useViewPreference("dashboard-view");

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const [searchParams] = useSearchParams();

  const [currentFolderId, setCurrentFolderId] = useState(
    searchParams.get("folderId") || null,
  );

  const [path, setPath] = useState(() => {
    const pathParam = searchParams.get("path");
    if (pathParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(pathParam));

        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name) {
          return parsed;
        }
        return [{ id: null, name: "My Drive" }];
      } catch {
        return [{ id: null, name: "My Drive" }];
      }
    }
    return [{ id: null, name: "My Drive" }];
  });

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState(null);

  const [activeItem, setActiveItem] = useState(null);

  const handleDragStart = (event) => {
    const { type, id, name } = event.active.data.current;
    setActiveItem({ type, id, name });
  };

  const handleDragEnd = async (event) => {
    setActiveItem(null);
    const { active, over } = event;

    if (!over) return;

    const dragData = active.data.current;
    const dropData = over.data.current;

    if (!dragData || !dropData) return;

    const targetFolderId = dropData.folderId ?? null;

    if (dragData.type === "folder" && targetFolderId === dragData.id) return;

    if (dragData.type === "file" && targetFolderId === currentFolderId) return;
    if (dragData.type === "folder" && targetFolderId === currentFolderId)
      return;

    try {
      if (dragData.type === "file") {
        await API.patch(`/files/${dragData.id}`, {
          folderId: targetFolderId,
        });
        toast.success(`"${dragData.name}" moved successfully`);
      } else if (dragData.type === "folder") {
        await API.patch(`/files/folders/${dragData.id}`, {
          parentId: targetFolderId,
        });
        toast.success(`"${dragData.name}" moved successfully`);
      }

      fetchContent(currentFolderId);
      window.dispatchEvent(new Event("storage-updated"));
    } catch (err) {
      console.error("Move failed:", err);
      toast.error(`Failed to move "${dragData.name}"`);
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        API.get("/files", { params: { folderId: currentFolderId } }),
        API.get("/files/folders", { params: { parentId: currentFolderId } }),
      ]);
      setFiles(filesRes.data.files || []);
      setFolders(foldersRes.data.folders || []);
    } catch (err) {
      console.error(
        "Failed to fetch content:",
        err.response?.data?.message || err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(currentFolderId); // fetchContent(); previous code
  }, [currentFolderId]);

  const handleFolderClick = (id, name) => {
    setCurrentFolderId(id);
    setPath((prev) => [...prev, { id, name }]);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === path.length - 1) return;
    const newPath = path.slice(0, index + 1);
    const targetFolder = newPath[newPath.length - 1];
    setPath(newPath);
    setCurrentFolderId(targetFolder.id);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreating(true);
    try {
      await API.post("/files/folders", {
        name: newFolderName,
        parentId: currentFolderId,
      });
      setNewFolderName("");
      setIsFolderModalOpen(false);
      fetchContent(currentFolderId);
      toast.success("Folder created successfully");
    } catch (err) {
      console.error("Error creating folder:", err);
      if (err.response?.status === 409) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to create folder");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileAction = async (file, action) => {
    if (action === "download") {
      await downloadFile(file);
    }

    if (action === "delete") {
      try {
        await API.delete(`/files/${file.id}`);
        fetchContent(currentFolderId);
        window.dispatchEvent(new Event("storage-updated"));
        toast.success("File moved to trash");
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error("Failed to delete file");
      }
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
    if (action === "versions") {
      setVersionTarget(file);
      setIsVersionModalOpen(true);
    }
  };

  const handleFolderAction = async (folder, action) => {
    if (action === "delete") {
      try {
        await API.delete(`/files/folders/${folder.id}`);
        fetchContent(currentFolderId);
        toast.success("Folder moved to trash");
      } catch (err) {
        console.error("Folder delete failed:", err);
        toast.error("Failed to delete folder");
      }
    }

    if (action === "rename") {
      setRenameTarget({ ...folder, type: "folder" });
      setNewName(folder.name);
      setIsRenameModalOpen(true);
    }
  };

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
      fetchContent(currentFolderId);
      toast.success(
        `${renameTarget.type === "folder" ? "Folder" : "File"} renamed successfully`,
      );
    } catch (err) {
      console.error("Rename failed:", err);
      if (err.response?.status === 409) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to rename");
      }
    } finally {
      setIsRenaming(false);
    }
  };

  const getSortedItems = (items) => {
    return [...items].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      }

      if (sortBy === "size") {
        comparison = (a.size_bytes || 0) - (b.size_bytes || 0);
      }

      if (sortBy === "date") {
        comparison = new Date(a.updated_at) - new Date(b.updated_at);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const sortedFiles = getSortedItems(files);
  const sortedFolders = getSortedItems(folders);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
  );

  return (
    <>
      <DragOverlay>
        {activeItem ? (
          <div
            className="
        bg-surface border-2 border-brand-blue rounded-2xl
        shadow-2xl shadow-brand-blue/20
        p-3 opacity-95 rotate-2
        flex flex-col items-center gap-2
        w-32
      "
          >
            {activeItem.type === "folder" ? (
              <div className="p-3 bg-brand-blue/10 rounded-xl">
                <Folder
                  size={32}
                  className="text-brand-blue fill-brand-blue/30"
                />
              </div>
            ) : (
              <div className="p-3 bg-bg-main rounded-xl">
                <FileIcon fileName={activeItem.name} size={32} />
              </div>
            )}
            <p className="text-xs font-bold text-text-primary truncate w-full text-center">
              {activeItem.name}
            </p>
          </div>
        ) : null}
      </DragOverlay>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <div className="px-2">
            <Breadcrumbs
              items={path.map((p, idx) => ({
                label: p.name,
                folderId: p.id,
                onClick: () => handleBreadcrumbClick(idx),
              }))}
            />
          </div>

          <div className="bg-surface p-4 rounded-3xl border border-border shadow-sm space-y-3">
            <div className="hidden lg:flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-text-primary px-2 truncate min-w-0">
                {path[path.length - 1].name}
              </h2>

              <div className="flex items-center gap-2 shrink-0">
                <SortDropdown
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onChange={(key, order) => {
                    setSortBy(key);
                    setSortOrder(order);
                  }}
                />
                <ViewToggle viewMode={viewMode} onToggle={toggleView} />

                <div className="w-px h-6 bg-border" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFolderModalOpen(true)}
                  className="gap-1.5"
                >
                  <Plus size={16} /> New Folder
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="gap-1.5"
                >
                  <Upload size={16} /> Upload
                </Button>
              </div>
            </div>

            <div className="hidden xs:flex lg:hidden flex-col gap-3">
              <h2 className="text-xl font-bold text-text-primary px-2 truncate">
                {path[path.length - 1].name}
              </h2>

              <div className="flex items-center justify-between gap-2">
                <SortDropdown
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onChange={(key, order) => {
                    setSortBy(key);
                    setSortOrder(order);
                  }}
                />
                <ViewToggle viewMode={viewMode} onToggle={toggleView} />

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-px h-6 bg-border" />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsFolderModalOpen(true)}
                    className="gap-1.5"
                  >
                    <Plus size={16} /> New Folder
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="gap-1.5"
                  >
                    <Upload size={16} /> Upload
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex xs:hidden flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-text-primary px-2 truncate min-w-0">
                  {path[path.length - 1].name}
                </h2>
                <SortDropdown
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onChange={(key, order) => {
                    setSortBy(key);
                    setSortOrder(order);
                  }}
                />
                <ViewToggle viewMode={viewMode} onToggle={toggleView} />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFolderModalOpen(true)}
                  className="gap-1.5 flex-1 justify-center"
                >
                  <Plus size={16} /> New Folder
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="gap-1.5 flex-1 justify-center"
                >
                  <Upload size={16} /> Upload
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
              <p className="text-text-secondary font-medium">
                Loading your files...
              </p>
            </div>
          ) : viewMode === "list" ? (
            <FileListView
              files={sortedFiles}
              folders={sortedFolders}
              onFileAction={handleFileAction}
              onFolderAction={handleFolderAction}
              onNavigate={handleFolderClick}
              currentFolderId={currentFolderId}
              folderName={path[path.length - 1].name}
              fullPath={path}
            />
          ) : (
            <div className="space-y-10">
              {folders.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
                    Folders
                  </h3>
                  <motion.div
                    layout
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                  >
                    <AnimatePresence mode="popLayout">
                      {sortedFolders.map((folder) => (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          onNavigate={handleFolderClick}
                          onAction={handleFolderAction}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </section>
              )}

              <section className="space-y-4">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
                  Files
                </h3>
                {files.length > 0 ? (
                  <motion.div
                    layout
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                  >
                    <AnimatePresence mode="popLayout">
                      {sortedFiles.map((file) => (
                        <FileCard
                          key={file.id}
                          file={file}
                          onAction={handleFileAction}
                          currentFolderId={currentFolderId}
                          folderName={path[path.length - 1].name}
                          fullPath={path}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : folders.length > 0 ? (
                  <div className="text-center py-12 text-text-secondary">
                    No files in this folder.
                  </div>
                ) : null}

                {files.length === 0 && folders.length === 0 && (
                  <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
                    <p className="text-text-secondary">This folder is empty.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          <Modal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
            title="Create New Folder"
          >
            <form onSubmit={handleCreateFolder} className="space-y-6">
              <Input
                label="Folder Name"
                placeholder="e.g. Work Projects"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                required
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsFolderModalOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isCreating}
                  loadingText="Creating..."
                >
                  Create
                </Button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            title="Upload Files"
            maxWidth="max-w-lg"
          >
            <UploadZone
              currentFolderId={currentFolderId}
              onUploadComplete={() => {
                fetchContent(currentFolderId);
                setIsUploadModalOpen(false);
              }}
            />
          </Modal>

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
        </div>
      </DndContext>
    </>
  );
};

export default Dashboard;
