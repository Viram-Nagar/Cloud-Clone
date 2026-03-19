import FilePreviewModal from "../components/ui/FilePreviewModal";
import React, { useState, useEffect } from "react";
import API from "../api.jsx";
import UploadZone from "../components/ui/UploadZone";
import FileCard from "../components/ui/FileCard";
import FolderCard from "../components/ui/FolderCard";
import ShareModal from "../components/ui/ShareModal";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import VersionModal from "../components/ui/VersionModal";

import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Grid, List as ListIcon, Plus } from "lucide-react";

const Dashboard = () => {
  // --- 1. STATE MANAGEMENT ---
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null); // { id, name, type: 'file'|'folder' }
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [path, setPath] = useState([{ id: null, name: "My Drive" }]);

  // Create Folder Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);

  const [sortBy, setSortBy] = useState("name"); // 'name' | 'size' | 'date'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' | 'desc'

  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState(null);

  // --- 2. DATA FETCHING ---
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
    fetchContent();
  }, [currentFolderId]);

  // --- 3. NAVIGATION LOGIC ---
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

  // --- 4. CREATE FOLDER ---
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
      fetchContent();
    } catch (err) {
      console.error("Error creating folder:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // --- 5. FILE ACTIONS ---
  const handleFileAction = async (file, action) => {
    if (action === "download") {
      try {
        const res = await API.get(`/files/${file.id}/download`);
        window.open(res.data.downloadUrl, "_blank");
      } catch (err) {
        console.error("Download failed:", err);
      }
    }

    if (action === "delete") {
      try {
        await API.delete(`/files/${file.id}`);
        fetchContent();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    if (action === "rename") {
      setRenameTarget({ ...file, type: "file" });
      setNewName(file.name); // pre-fill current name
      setIsRenameModalOpen(true);
    }

    if (action === "share") {
      // Day 11 — placeholder
      setShareTarget({ id: file.id, name: file.name, type: "file" });
      setIsShareModalOpen(true);
    }
    if (action === "versions") {
      setVersionTarget(file);
      setIsVersionModalOpen(true);
    }
  };

  // --- 6. FOLDER ACTIONS ---
  const handleFolderAction = async (folder, action) => {
    if (action === "delete") {
      try {
        await API.delete(`/files/folders/${folder.id}`);
        fetchContent();
      } catch (err) {
        console.error("Folder delete failed:", err);
      }
    }

    if (action === "rename") {
      setRenameTarget({ ...folder, type: "folder" });
      setNewName(folder.name); // pre-fill current name
      setIsRenameModalOpen(true);
    }
  };

  // --- 7. RENAME SUBMIT ---
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
      fetchContent();
    } catch (err) {
      console.error("Rename failed:", err);
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

  // Sorted versions of files and folders
  const sortedFiles = getSortedItems(files);
  const sortedFolders = getSortedItems(folders);

  return (
    <div className="space-y-6">
      {/* A. BREADCRUMBS */}
      <div className="px-2">
        <Breadcrumbs
          items={path.map((p, idx) => ({
            label: p.name,
            onClick: () => handleBreadcrumbClick(idx),
          }))}
        />
      </div>

      {/* B. ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 rounded-3xl border border-border shadow-sm">
        <h2 className="text-xl font-bold text-text-primary px-2 truncate">
          {path[path.length - 1].name}
        </h2>
        <div className="flex items-center gap-2">
          {/* SORT BUTTONS */}
          <div className="flex items-center gap-1 bg-bg-main border border-border rounded-xl p-1 overflow-x-auto">
            {[
              { key: "name", label: "Name" },
              { key: "size", label: "Size" },
              { key: "date", label: "Date" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  if (sortBy === option.key) {
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                  } else {
                    setSortBy(option.key);
                    setSortOrder("asc");
                  }
                }}
                className={`
        px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150
        flex items-center gap-1 shrink-0
        ${
          sortBy === option.key
            ? "bg-surface text-text-primary shadow-sm border border-border"
            : "text-text-secondary hover:text-text-primary"
        }
      `}
              >
                {option.label}
                {sortBy === option.key && (
                  <span className="text-brand-blue">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="hidden sm:block w-px h-6 bg-border mx-2" />
          <div className="hidden sm:block w-px h-6 bg-border mx-2" />
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => setIsFolderModalOpen(true)}
          >
            <Plus size={18} /> New Folder
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={18} /> Upload
          </Button>
        </div>
      </div>

      {/* C. CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
          <p className="text-text-secondary font-medium">
            Loading your files...
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* FOLDERS SECTION */}
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

          {/* FILES SECTION */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
              Files
            </h3>
            {files.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {sortedFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onAction={handleFileAction}
                      onPreview={(f) => setPreviewFile(f)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-12 text-text-secondary">
                No files in this folder.
              </div>
            )}

            {files.length === 0 && folders.length === 0 && (
              <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
                <p className="text-text-secondary">This folder is empty.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* D. CREATE FOLDER MODAL */}
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

      {/* E. UPLOAD MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Files"
        maxWidth="max-w-lg"
      >
        <UploadZone
          currentFolderId={currentFolderId}
          onUploadComplete={() => {
            fetchContent();
            setIsUploadModalOpen(false);
          }}
        />
      </Modal>

      {/* F. RENAME MODAL */}
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

      {/* G. FILE PREVIEW MODAL */}
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

      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => {
          setIsVersionModalOpen(false);
          setVersionTarget(null);
        }}
        file={versionTarget}
      />
    </div>
  );
};

export default Dashboard;

// import FilePreviewModal from "../components/ui/FilePreviewModal";
// import React, { useState, useEffect } from "react";
// import API from "../api.jsx";
// import UploadZone from "../components/ui/UploadZone";
// // Reusable UI Components from your library
// import FileCard from "../components/ui/FileCard";
// import FolderCard from "../components/ui/FolderCard";
// import Breadcrumbs from "../components/ui/Breadcrumbs";
// import Button from "../components/ui/Button";
// import Modal from "../components/ui/Modal";
// import Input from "../components/ui/Input";

// // Icons and Motion
// import { motion, AnimatePresence } from "framer-motion";
// import { Upload, Grid, List as ListIcon, Plus } from "lucide-react";

// const Dashboard = () => {
//   // --- 1. STATE MANAGEMENT ---
//   const [files, setFiles] = useState([]);
//   const [folders, setFolders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
//   const [previewFile, setPreviewFile] = useState(null);
//   const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
//   const [renameTarget, setRenameTarget] = useState(null);
//   const [newName, setNewName] = useState("");
//   const [isRenaming, setIsRenaming] = useState(false);

//   // Navigation State
//   const [currentFolderId, setCurrentFolderId] = useState(null);
//   const [path, setPath] = useState([{ id: null, name: "My Drive" }]);

//   // Create Folder Modal State
//   const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
//   const [newFolderName, setNewFolderName] = useState("");
//   const [isCreating, setIsCreating] = useState(false);

//   // --- 2. DATA FETCHING ---
//   // --- src/pages/Dashboard.jsx ---

//   const fetchContent = async () => {
//     setLoading(true);
//     try {
//       // 1. Files: calls /api/files (with optional ?folderId=...)
//       // 2. Folders: calls /api/files/folders (with optional ?parentId=...)
//       const [filesRes, foldersRes] = await Promise.all([
//         API.get("/files", {
//           params: { folderId: currentFolderId },
//         }),
//         API.get("/files/folders", {
//           params: { parentId: currentFolderId },
//         }),
//       ]);

//       setFiles(filesRes.data.files || []);
//       setFolders(foldersRes.data.folders || []);
//     } catch (err) {
//       console.error(
//         "Failed to fetch content:",
//         err.response?.data?.message || err.message,
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchContent();
//   }, [currentFolderId]);

//   // --- 3. NAVIGATION LOGIC ---
//   const handleFolderClick = (id, name) => {
//     setCurrentFolderId(id);
//     setPath((prev) => [...prev, { id, name }]);
//   };

//   // Inside Dashboard.jsx - Replace your old function with this:
//   const handleBreadcrumbClick = (index) => {
//     // If they click the current folder, do nothing
//     if (index === path.length - 1) return;

//     // Create the new path up to the clicked index
//     const newPath = path.slice(0, index + 1);
//     const targetFolder = newPath[newPath.length - 1];

//     setPath(newPath);
//     setCurrentFolderId(targetFolder.id); // This will trigger the useEffect to fetch data
//   };

//   // const handleBreadcrumbClick = (index) => {
//   //   const newPath = path.slice(0, index + 1);
//   //   const targetFolder = newPath[newPath.length - 1];
//   //   setPath(newPath);
//   //   setCurrentFolderId(targetFolder.id);
//   // };

//   // --- 4. ACTION LOGIC (CREATE FOLDER) ---
//   const handleCreateFolder = async (e) => {
//     e.preventDefault();
//     if (!newFolderName.trim()) return;

//     setIsCreating(true);
//     try {
//       await API.post("/files/folders", {
//         name: newFolderName,
//         parentId: currentFolderId,
//       });
//       setNewFolderName("");
//       setIsFolderModalOpen(false);
//       fetchContent(); // Reload data to show the new folder
//     } catch (err) {
//       console.error("Error creating folder:", err);
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* A. BREADCRUMBS */}
//       <div className="px-2">
//         <Breadcrumbs
//           items={path.map((p, idx) => ({
//             label: p.name,
//             onClick: () => handleBreadcrumbClick(idx),
//           }))}
//         />
//       </div>

//       {/* B. RESPONSIVE ACTION BAR */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 rounded-3xl border border-border shadow-sm">
//         <h2 className="text-xl font-bold text-text-primary px-2 truncate">
//           {path[path.length - 1].name}
//         </h2>

//         <div className="flex items-center gap-2">
//           <Button variant="ghost" size="sm" className="hidden sm:flex">
//             <Grid size={18} />
//           </Button>
//           <Button variant="ghost" size="sm" className="hidden sm:flex">
//             <ListIcon size={18} />
//           </Button>
//           <div className="hidden sm:block w-px h-6 bg-border mx-2" />
//           {/* TRIGGER MODAL */}
//           <Button
//             variant="secondary"
//             className="gap-2"
//             onClick={() => setIsFolderModalOpen(true)}
//           >
//             <Plus size={18} /> New Folder
//           </Button>
//           <Button
//             variant="primary"
//             className="gap-2"
//             onClick={() => setIsUploadModalOpen(true)}
//             loadingText="Uploading..."
//           >
//             <Upload size={18} /> Upload
//           </Button>
//         </div>
//       </div>

//       {/* C. CONTENT AREA (GRID) */}
//       {loading ? (
//         <div className="flex flex-col items-center justify-center py-32">
//           <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
//           <p className="text-text-secondary font-medium">
//             Loading your files...
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-10">
//           {/* FOLDERS SECTION */}
//           {folders.length > 0 && (
//             <section className="space-y-4">
//               <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
//                 Folders
//               </h3>
//               <motion.div
//                 layout
//                 className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
//               >
//                 <AnimatePresence mode="popLayout">
//                   {folders.map((folder) => (
//                     <FolderCard
//                       key={folder.id}
//                       folder={folder}
//                       onNavigate={handleFolderClick}
//                       onAction={(f) => console.log("Menu for", f.name)}
//                     />
//                   ))}
//                 </AnimatePresence>
//               </motion.div>
//             </section>
//           )}

//           {/* FILES SECTION */}
//           <section className="space-y-4">
//             <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">
//               Files
//             </h3>
//             {files.length > 0 ? (
//               <motion.div
//                 layout
//                 className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
//               >
//                 <AnimatePresence mode="popLayout">
//                   {files.map((file) => (
//                     <FileCard
//                       key={file.id}
//                       file={file}
//                       onAction={(f) => console.log("Menu for", f.name)}
//                       onPreview={(f) => setPreviewFile(f)}
//                     />
//                   ))}
//                 </AnimatePresence>
//               </motion.div>
//             ) : (
//               <div className="text-center py-12 text-text-secondary">
//                 No files in this folder.
//               </div>
//             )}

//             {files.length === 0 && folders.length === 0 && (
//               <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
//                 <p className="text-text-secondary">This folder is empty.</p>
//               </div>
//             )}
//           </section>
//         </div>
//       )}

//       {/* D. CREATE FOLDER MODAL */}
//       <Modal
//         isOpen={isFolderModalOpen}
//         onClose={() => setIsFolderModalOpen(false)}
//         title="Create New Folder"
//       >
//         <form onSubmit={handleCreateFolder} className="space-y-6">
//           <Input
//             label="Folder Name"
//             placeholder="e.g. Work Projects"
//             value={newFolderName}
//             onChange={(e) => setNewFolderName(e.target.value)}
//             autoFocus
//             required
//           />
//           <div className="flex justify-end gap-3">
//             <Button
//               variant="ghost"
//               onClick={() => setIsFolderModalOpen(false)}
//               type="button"
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="primary"
//               type="submit"
//               isLoading={isCreating}
//               loadingText="Creating..."
//             >
//               Create
//             </Button>
//           </div>
//         </form>
//       </Modal>
//       <Modal
//         isOpen={isUploadModalOpen}
//         onClose={() => setIsUploadModalOpen(false)}
//         title="Upload Files"
//         maxWidth="max-w-lg"
//       >
//         <UploadZone
//           currentFolderId={currentFolderId}
//           onUploadComplete={() => {
//             fetchContent();
//             setIsUploadModalOpen(false);
//           }}
//         />
//       </Modal>
//       <FilePreviewModal
//         file={previewFile}
//         isOpen={!!previewFile}
//         onClose={() => setPreviewFile(null)}
//       />
//     </div>
//   );
// };

// export default Dashboard;

// import React, { useState, useEffect } from "react";
// import API from "../api";
// // Reusable Atoms & Components
// import FileCard from "../components/ui/FileCard";
// import FolderCard from "../components/ui/FolderCard";
// import Breadcrumbs from "../components/ui/Breadcrumbs";
// import Button from "../components/ui/Button";
// import { motion, AnimatePresence } from "framer-motion";
// import { Upload, Grid, List as ListIcon, Plus, Info } from "lucide-react";

// const Dashboard = () => {
//   const [files, setFiles] = useState([]);
//   const [folders, setFolders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentFolderId, setCurrentFolderId] = useState(null);

//   // State for Breadcrumbs: Track the folder hierarchy
//   const [path, setPath] = useState([{ id: null, name: "My Drive" }]);

//   // 1. Fetch data from backend
//   const fetchContent = async () => {
//     setLoading(true);
//     try {
//       // Logic from your backend routes: filter by parent/folder ID
//       const [filesRes, foldersRes] = await Promise.all([
//         API.get(
//           `/files${currentFolderId ? `?folderId=${currentFolderId}` : ""}`,
//         ),
//         API.get(
//           `/folders${currentFolderId ? `?parentId=${currentFolderId}` : ""}`,
//         ),
//       ]);
//       setFiles(filesRes.data.files || []);
//       setFolders(foldersRes.data.folders || []);
//     } catch (err) {
//       console.error("Failed to fetch dashboard content", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchContent();
//   }, [currentFolderId]);

//   // Navigate deeper into folders
//   const handleFolderClick = (id, name) => {
//     setCurrentFolderId(id);
//     setPath([...path, { id, name }]); // Push new folder to path
//   };

//   // Go back using breadcrumbs
//   const handleBreadcrumbClick = (index) => {
//     const newPath = path.slice(0, index + 1);
//     const targetFolder = newPath[newPath.length - 1];
//     setPath(newPath);
//     setCurrentFolderId(targetFolder.id);
//   };

//   const handleAction = (item) => {
//     console.log("Action menu triggered for:", item.name);
//   };

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500">
//       {/* 1. Breadcrumbs Navigation */}
//       <div className="flex items-center justify-between px-2">
//         <Breadcrumbs
//           items={path.map((p, idx) => ({
//             label: p.name,
//             onClick: () => handleBreadcrumbClick(idx),
//           }))}
//         />
//       </div>

//       {/* 2. Responsive Action Bar */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 rounded-3xl border border-border shadow-sm">
//         <div className="flex items-center gap-3">
//           <h2 className="text-xl font-bold text-text-primary px-2 truncate max-w-50 md:max-w-md">
//             {path[path.length - 1].name}
//           </h2>
//         </div>

//         <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
//           <Button variant="ghost" size="sm" className="hidden sm:flex">
//             <Grid size={18} />
//           </Button>
//           <Button variant="ghost" size="sm" className="hidden sm:flex">
//             <ListIcon size={18} />
//           </Button>
//           <div className="hidden sm:block w-px h-6 bg-border mx-2" />

//           <Button variant="secondary" className="gap-2 whitespace-nowrap">
//             <Plus size={18} />{" "}
//             <span className="hidden xs:inline">New Folder</span>
//           </Button>

//           <Button
//             variant="primary"
//             className="gap-2 whitespace-nowrap"
//             loadingText="Uploading..."
//           >
//             <Upload size={18} />{" "}
//             <span className="hidden xs:inline">Upload</span>
//           </Button>
//         </div>
//       </div>

//       {/* 3. Content Area */}
//       {loading ? (
//         <div className="flex flex-col items-center justify-center py-32 space-y-4">
//           <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full" />
//           <p className="text-text-secondary font-medium animate-pulse">
//             Scanning your cloud...
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-10">
//           {/* Folders Section - Only show if folders exist */}
//           {folders.length > 0 && (
//             <section className="space-y-4">
//               <div className="flex items-center gap-2 px-1">
//                 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
//                   Folders
//                 </h3>
//                 <div className="h-px flex-1 bg-border/50" />
//               </div>

//               <motion.div
//                 layout
//                 className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
//               >
//                 <AnimatePresence mode="popLayout">
//                   {folders.map((folder) => (
//                     <FolderCard
//                       key={folder.id}
//                       folder={folder}
//                       onNavigate={handleFolderClick}
//                       onAction={handleAction}
//                     />
//                   ))}
//                 </AnimatePresence>
//               </motion.div>
//             </section>
//           )}

//           {/* Files Section */}
//           <section className="space-y-4">
//             <div className="flex items-center gap-2 px-1">
//               <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
//                 Files
//               </h3>
//               <div className="h-px flex-1 bg-border/50" />
//             </div>

//             {files.length > 0 ? (
//               <motion.div
//                 layout
//                 className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
//               >
//                 <AnimatePresence mode="popLayout">
//                   {files.map((file) => (
//                     <FileCard
//                       key={file.id}
//                       file={file}
//                       onAction={handleAction}
//                     />
//                   ))}
//                 </AnimatePresence>
//               </motion.div>
//             ) : (
//               /* Empty State Coordination */
//               folders.length === 0 && (
//                 <div className="text-center py-24 bg-bg-main/40 rounded-[2rem] border-2 border-dashed border-border/60">
//                   <div className="bg-surface w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
//                     <Upload className="text-brand-blue" size={32} />
//                   </div>
//                   <h3 className="text-xl font-bold text-text-primary">
//                     Your drive is empty
//                   </h3>
//                   <p className="text-text-secondary mt-2 max-w-xs mx-auto">
//                     This folder is waiting for your files. Drag and drop here to
//                     start uploading.
//                   </p>
//                   <div className="mt-8">
//                     <Button variant="primary" className="px-10 py-3">
//                       Upload First File
//                     </Button>
//                   </div>
//                 </div>
//               )
//             )}
//           </section>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;

// import React, { useState, useEffect } from "react";
// import API from "../api";
// import FileCard from "../components/ui/FileCard";
// import { motion, AnimatePresence } from "framer-motion";
// import { FolderPlus, Upload, Grid, List as ListIcon } from "lucide-react";
// import Button from "../components/ui/Button";

// const Dashboard = () => {
//   const [files, setFiles] = useState([]);
//   const [folders, setFolders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentFolderId, setCurrentFolderId] = useState(null);

//   // 1. Fetch data from backend
//   const fetchContent = async () => {
//     setLoading(true);
//     try {
//       // COORDINATION: Calling your backend routes from Drive_backend.txt
//       const [filesRes, foldersRes] = await Promise.all([
//         API.get(
//           `/files${currentFolderId ? `?folderId=${currentFolderId}` : ""}`,
//         ),
//         API.get(
//           `/folders${currentFolderId ? `?parentId=${currentFolderId}` : ""}`,
//         ),
//       ]);
//       setFiles(filesRes.data.files);
//       setFolders(foldersRes.data.folders);
//     } catch (err) {
//       console.error("Failed to fetch dashboard content", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchContent();
//   }, [currentFolderId]);

//   return (
//     <div className="space-y-8">
//       {/* Action Bar */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-3xl border border-border">
//         <h2 className="text-xl font-bold text-text-primary px-2">My Files</h2>
//         <div className="flex items-center gap-2">
//           <Button variant="ghost" size="sm">
//             <Grid size={18} />
//           </Button>
//           <Button variant="ghost" size="sm">
//             <ListIcon size={18} />
//           </Button>
//           <div className="w-1px h-6 bg-border mx-2" />
//           <Button variant="primary" className="gap-2">
//             <Upload size={18} /> Upload
//           </Button>
//         </div>
//       </div>

//       {/* Content Grid */}
//       {loading ? (
//         <div className="flex justify-center py-20">
//           <div className="animate-spin h-8 w-8 border-4 border-brand-blue border-t-transparent rounded-full" />
//         </div>
//       ) : (
//         <AnimatePresence mode="wait">
//           <motion.div
//             className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//           >
//             {/* Logic: Map through folders first, then files */}
//             {folders.map((folder) => (
//               <div
//                 key={folder.id}
//                 onClick={() => setCurrentFolderId(folder.id)}
//               >
//                 {/* Imagine a FolderCard component here */}
//                 <Card className="p-4 bg-brand-blue/5 border-brand-blue/20 cursor-pointer">
//                   <span className="font-bold text-brand-blue">
//                     📁 {folder.name}
//                   </span>
//                 </Card>
//               </div>
//             ))}

//             {files.map((file) => (
//               <FileCard key={file.id} file={file} />
//             ))}
//           </motion.div>
//         </AnimatePresence>
//       )}

//       {/* Empty State */}
//       {!loading && files.length === 0 && folders.length === 0 && (
//         <div className="text-center py-20">
//           <p className="text-text-secondary">
//             No files here yet. Start by uploading something!
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;
