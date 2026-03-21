import useViewPreference from "../hooks/useViewPreference";
import ViewToggle from "../components/ui/ViewToggle";
import SortDropdown from "../components/ui/SortDropdown";
import FileListView from "../components/ui/FileListView";
import { toast } from "react-toastify";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api.jsx";
import { useNavigate } from "react-router-dom";
import downloadFile from "../util/DownloadFile.jsx";
import FileCard from "../components/ui/FileCard";
import FolderCard from "../components/ui/FolderCard";
import ShareModal from "../components/ui/ShareModal";
import VersionModal from "../components/ui/VersionModal";

const Starred = () => {
  const { viewMode, toggleView } = useViewPreference("starred-view");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [starredItems, setStarredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  // --- Navigate to folder with full breadcrumb path ---
  const handleFolderNavigate = async (folderId, folderName) => {
    try {
      const res = await API.get(`/files/folder-path/${folderId}`);
      const fullPath = res.data.path;
      navigate(
        `/dashboard?folderId=${folderId}&folderName=${encodeURIComponent(folderName)}&path=${encodeURIComponent(JSON.stringify(fullPath))}`,
      );
    } catch (err) {
      console.error("Failed to get folder path:", err);
      // Fallback — navigate without full path
      navigate(
        `/dashboard?folderId=${folderId}&folderName=${encodeURIComponent(folderName)}&path=${encodeURIComponent(
          JSON.stringify([
            { id: null, name: "My Drive" },
            { id: folderId, name: folderName },
          ]),
        )}`,
      );
    }
  };

  const handleUnstar = async (item) => {
    try {
      await API.post("/files/stars/toggle", {
        fileId: item.type === "file" ? item.id : undefined,
        folderId: item.type === "folder" ? item.id : undefined,
      });
      setStarredItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error("Unstar failed:", err);
    }
  };

  const handleFileAction = async (file, action) => {
    if (action === "download") {
      await downloadFile(file);
    }

    if (action === "delete") {
      try {
        await API.delete(`/files/${file.id}`);
        setStarredItems((prev) => prev.filter((i) => i.id !== file.id));
        toast.success("File moved to trash");
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error("Failed to delete file");
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

    if (action === "versions") {
      setVersionTarget(file);
      setIsVersionModalOpen(true);
    }
  };

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
      }
      setIsRenameModalOpen(false);
      setRenameTarget(null);
      setNewName("");
      fetchStarredItems();
      toast.success("Renamed successfully");
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

  const getSorted = (items) =>
    [...items].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      if (sortBy === "size")
        comparison = (a.size_bytes || 0) - (b.size_bytes || 0);
      if (sortBy === "date")
        comparison = new Date(a.updated_at) - new Date(b.updated_at);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const files = starredItems.filter((i) => i.type === "file");
  const folders = starredItems.filter((i) => i.type === "folder");
  const sortedFiles = getSorted(files);
  const sortedFolders = getSorted(folders);

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

      {/* CONTROLS */}
      {!loading && starredItems.length > 0 && (
        <div className="flex items-center gap-2">
          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChange={(key, order) => {
              setSortBy(key);
              setSortOrder(order);
            }}
          />
          <div className="ml-auto">
            <ViewToggle viewMode={viewMode} onToggle={toggleView} />
          </div>
        </div>
      )}

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
      {!loading &&
        starredItems.length > 0 &&
        (viewMode === "list" ? (
          <FileListView
            files={sortedFiles}
            folders={sortedFolders}
            onFileAction={handleFileAction}
            onFolderAction={handleFolderAction}
            onNavigate={handleFolderNavigate}
            currentFolderId={null}
            folderName="Starred"
            fullPath={[{ id: null, name: "My Drive" }]}
            source="starred"
          />
        ) : (
          <div className="space-y-10">
            {/* STARRED FOLDERS */}
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
                        onNavigate={handleFolderNavigate}
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
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                >
                  <AnimatePresence mode="popLayout">
                    {sortedFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onAction={handleFileAction}
                        onStarToggle={() => handleUnstar(file)}
                        currentFolderId={file.folder_id ?? null}
                        folderName="Starred"
                        sharedRole={file.role ?? null}
                        fullPath={[{ id: null, name: "My Drive" }]}
                        isShared={!!file.role}
                        source="starred"
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            )}
          </div>
        ))}

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTarget(null);
        }}
        resource={shareTarget}
      />

      {/* VERSION MODAL */}
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

// import useViewPreference from "../hooks/useViewPreference";
// import ViewToggle from "../components/ui/ViewToggle";
// import SortDropdown from "../components/ui/SortDropdown";
// import FileListView from "../components/ui/FileListView";
// import { toast } from "react-toastify";
// import Modal from "../components/ui/Modal";
// import Input from "../components/ui/Input";
// import Button from "../components/ui/Button";
// import React, { useState, useEffect } from "react";
// import { Star } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import API from "../api.jsx";
// import downloadFile from "../util/DownloadFile.jsx";
// import FileCard from "../components/ui/FileCard";
// import FolderCard from "../components/ui/FolderCard";
// import ShareModal from "../components/ui/ShareModal";
// import VersionModal from "../components/ui/VersionModal";

// const Starred = () => {
//   const { viewMode, toggleView } = useViewPreference("starred-view");
//   const [sortBy, setSortBy] = useState("name");
//   const [sortOrder, setSortOrder] = useState("asc");
//   const [starredItems, setStarredItems] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [shareTarget, setShareTarget] = useState(null);
//   const [isShareModalOpen, setIsShareModalOpen] = useState(false);
//   const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
//   const [versionTarget, setVersionTarget] = useState(null);
//   const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
//   const [renameTarget, setRenameTarget] = useState(null);
//   const [newName, setNewName] = useState("");
//   const [isRenaming, setIsRenaming] = useState(false);

//   useEffect(() => {
//     fetchStarredItems();
//   }, []);

//   const fetchStarredItems = async () => {
//     setLoading(true);
//     try {
//       const res = await API.get("/files/stars");
//       setStarredItems(res.data.starredItems || []);
//     } catch (err) {
//       console.error("Failed to fetch starred items:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUnstar = async (item) => {
//     try {
//       await API.post("/files/stars/toggle", {
//         fileId: item.type === "file" ? item.id : undefined,
//         folderId: item.type === "folder" ? item.id : undefined,
//       });
//       setStarredItems((prev) => prev.filter((i) => i.id !== item.id));
//     } catch (err) {
//       console.error("Unstar failed:", err);
//     }
//   };

//   const handleFileAction = async (file, action) => {
//     if (action === "download") {
//       await downloadFile(file);
//     }

//     if (action === "delete") {
//       try {
//         await API.delete(`/files/${file.id}`);
//         setStarredItems((prev) => prev.filter((i) => i.id !== file.id));
//         toast.success("File moved to trash");
//       } catch (err) {
//         console.error("Delete failed:", err);
//         toast.error("Failed to delete file");
//       }
//     }

//     if (action === "share") {
//       setShareTarget({ id: file.id, name: file.name, type: "file" });
//       setIsShareModalOpen(true);
//     }

//     if (action === "rename") {
//       setRenameTarget({ ...file, type: "file" });
//       setNewName(file.name);
//       setIsRenameModalOpen(true);
//     }

//     if (action === "versions") {
//       setVersionTarget(file);
//       setIsVersionModalOpen(true);
//     }
//   };

//   const handleFolderAction = async (folder, action) => {
//     if (action === "delete") {
//       try {
//         await API.delete(`/files/folders/${folder.id}`);
//         setStarredItems((prev) => prev.filter((i) => i.id !== folder.id));
//       } catch (err) {
//         console.error("Folder delete failed:", err);
//       }
//     }

//     if (action === "rename") {
//       setRenameTarget({ ...folder, type: "folder" });
//       setNewName(folder.name);
//       setIsRenameModalOpen(true);
//     }
//   };

//   const handleRename = async (e) => {
//     e.preventDefault();
//     if (!newName.trim()) return;
//     setIsRenaming(true);
//     try {
//       if (renameTarget.type === "folder") {
//         await API.patch(`/files/folders/${renameTarget.id}`, {
//           newName: newName.trim(),
//         });
//       } else {
//         try {
//           await API.patch(`/files/${renameTarget.id}`, {
//             newName: newName.trim(),
//           });
//         } catch (err) {
//           if (err.response?.status === 404) {
//             await API.patch(`/files/shared/${renameTarget.id}/rename`, {
//               newName: newName.trim(),
//             });
//           } else throw err;
//         }
//       }
//       setIsRenameModalOpen(false);
//       setRenameTarget(null);
//       setNewName("");
//       fetchStarredItems();
//       toast.success("Renamed successfully");
//     } catch (err) {
//       console.error("Rename failed:", err);
//       if (err.response?.status === 409) {
//         toast.error(err.response.data.message);
//       } else {
//         toast.error("Failed to rename");
//       }
//     } finally {
//       setIsRenaming(false);
//     }
//   };

//   const getSorted = (items) =>
//     [...items].sort((a, b) => {
//       let comparison = 0;
//       if (sortBy === "name") comparison = a.name.localeCompare(b.name);
//       if (sortBy === "size")
//         comparison = (a.size_bytes || 0) - (b.size_bytes || 0);
//       if (sortBy === "date")
//         comparison = new Date(a.updated_at) - new Date(b.updated_at);
//       return sortOrder === "asc" ? comparison : -comparison;
//     });

//   const files = starredItems.filter((i) => i.type === "file");
//   const folders = starredItems.filter((i) => i.type === "folder");
//   const sortedFiles = getSorted(files);
//   const sortedFolders = getSorted(folders);

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <div className="flex items-center justify-between bg-surface p-4 rounded-3xl border border-border shadow-sm">
//         <div className="flex items-center gap-3">
//           <div className="p-2.5 bg-yellow-50 rounded-xl">
//             <Star size={22} className="text-yellow-500 fill-yellow-400" />
//           </div>
//           <div>
//             <h2 className="text-xl font-bold text-text-primary">Starred</h2>
//             <p className="text-xs text-text-secondary">
//               {starredItems.length} starred item
//               {starredItems.length !== 1 ? "s" : ""}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* CONTROLS */}
//       {!loading && starredItems.length > 0 && (
//         <div className="flex items-center gap-2">
//           <SortDropdown
//             sortBy={sortBy}
//             sortOrder={sortOrder}
//             onChange={(key, order) => {
//               setSortBy(key);
//               setSortOrder(order);
//             }}
//           />
//           <div className="ml-auto">
//             <ViewToggle viewMode={viewMode} onToggle={toggleView} />
//           </div>
//         </div>
//       )}

//       {/* LOADING */}
//       {loading && (
//         <div className="flex flex-col items-center justify-center py-32">
//           <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
//           <p className="text-text-secondary font-medium">
//             Loading starred items...
//           </p>
//         </div>
//       )}

//       {/* EMPTY STATE */}
//       {!loading && starredItems.length === 0 && (
//         <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
//           <div className="flex flex-col items-center gap-3">
//             <div className="p-4 bg-bg-main rounded-2xl border border-border">
//               <Star size={32} className="text-text-secondary" />
//             </div>
//             <p className="text-text-primary font-bold">No starred items yet</p>
//             <p className="text-sm text-text-secondary">
//               Star files and folders to find them quickly here.
//             </p>
//           </div>
//         </div>
//       )}

//       {/* CONTENT */}
//       {/* CONTENT */}
//       {!loading &&
//         starredItems.length > 0 &&
//         (viewMode === "list" ? (
//           <FileListView
//             files={sortedFiles}
//             folders={sortedFolders}
//             onFileAction={handleFileAction}
//             onFolderAction={handleFolderAction}
//             onNavigate={() => {}}
//             currentFolderId={null}
//             folderName="Starred"
//             fullPath={[{ id: null, name: "My Drive" }]}
//             source="starred"
//           />
//         ) : (
//           <div className="space-y-10">
//             {/* STARRED FOLDERS */}
//             {folders.length > 0 && (
//               <section className="space-y-4">
//                 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
//                   Folders
//                 </h3>
//                 <motion.div
//                   layout
//                   className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
//                 >
//                   <AnimatePresence mode="popLayout">
//                     {sortedFolders.map((folder) => (
//                       <FolderCard
//                         key={folder.id}
//                         folder={folder}
//                         onNavigate={() => {}}
//                         onAction={handleFolderAction}
//                         onStarToggle={() => handleUnstar(folder)}
//                       />
//                     ))}
//                   </AnimatePresence>
//                 </motion.div>
//               </section>
//             )}

//             {/* STARRED FILES */}
//             {files.length > 0 && (
//               <section className="space-y-4">
//                 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
//                   Files
//                 </h3>
//                 <motion.div
//                   layout
//                   className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
//                 >
//                   <AnimatePresence mode="popLayout">
//                     {sortedFiles.map((file) => (
//                       <FileCard
//                         key={file.id}
//                         file={file}
//                         onAction={handleFileAction}
//                         onStarToggle={() => handleUnstar(file)}
//                         currentFolderId={file.folder_id ?? null}
//                         folderName="Starred"
//                         sharedRole={file.role ?? null}
//                         fullPath={[{ id: null, name: "My Drive" }]}
//                         isShared={!!file.role}
//                         source="starred"
//                       />
//                     ))}
//                   </AnimatePresence>
//                 </motion.div>
//               </section>
//             )}
//           </div>
//         ))}

//       {/* SHARE MODAL */}
//       <ShareModal
//         isOpen={isShareModalOpen}
//         onClose={() => {
//           setIsShareModalOpen(false);
//           setShareTarget(null);
//         }}
//         resource={shareTarget}
//       />

//       {/* VERSION MODAL */}
//       <VersionModal
//         isOpen={isVersionModalOpen}
//         onClose={() => {
//           setIsVersionModalOpen(false);
//           setVersionTarget(null);
//         }}
//         file={versionTarget}
//       />

//       {/* RENAME MODAL */}
//       <Modal
//         isOpen={isRenameModalOpen}
//         onClose={() => {
//           setIsRenameModalOpen(false);
//           setRenameTarget(null);
//           setNewName("");
//         }}
//         title={`Rename ${renameTarget?.type === "folder" ? "Folder" : "File"}`}
//       >
//         <form onSubmit={handleRename} className="space-y-6">
//           <Input
//             label="New Name"
//             placeholder={renameTarget?.name}
//             value={newName}
//             onChange={(e) => setNewName(e.target.value)}
//             autoFocus
//             required
//           />
//           <div className="flex justify-end gap-3">
//             <Button
//               variant="ghost"
//               type="button"
//               onClick={() => {
//                 setIsRenameModalOpen(false);
//                 setRenameTarget(null);
//                 setNewName("");
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="primary"
//               type="submit"
//               isLoading={isRenaming}
//               loadingText="Renaming..."
//             >
//               Rename
//             </Button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default Starred;
