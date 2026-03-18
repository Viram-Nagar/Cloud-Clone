import React, { useState, useEffect } from "react";
import API from "../api";

// Reusable UI Components from your library
import FileCard from "../components/ui/FileCard";
import FolderCard from "../components/ui/FolderCard";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

// Icons and Motion
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Grid, List as ListIcon, Plus } from "lucide-react";

const Dashboard = () => {
  // --- 1. STATE MANAGEMENT ---
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [path, setPath] = useState([{ id: null, name: "My Drive" }]);

  // Create Folder Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // --- 2. DATA FETCHING ---
  // --- src/pages/Dashboard.jsx ---

  const fetchContent = async () => {
    setLoading(true);
    try {
      // 1. Files: calls /api/files (with optional ?folderId=...)
      // 2. Folders: calls /api/files/folders (with optional ?parentId=...)
      const [filesRes, foldersRes] = await Promise.all([
        API.get("/files", {
          params: { folderId: currentFolderId },
        }),
        API.get("/files/folders", {
          params: { parentId: currentFolderId },
        }),
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
    setPath([...path, { id, name }]);
  };

  const handleBreadcrumbClick = (index) => {
    const newPath = path.slice(0, index + 1);
    const targetFolder = newPath[newPath.length - 1];
    setPath(newPath);
    setCurrentFolderId(targetFolder.id);
  };

  // --- 4. ACTION LOGIC (CREATE FOLDER) ---
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      await API.post("/folders", {
        name: newFolderName,
        parentId: currentFolderId,
      });
      setNewFolderName("");
      setIsFolderModalOpen(false);
      fetchContent(); // Reload data to show the new folder
    } catch (err) {
      console.error("Error creating folder:", err);
    } finally {
      setIsCreating(false);
    }
  };

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

      {/* B. RESPONSIVE ACTION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 rounded-3xl border border-border shadow-sm">
        <h2 className="text-xl font-bold text-text-primary px-2 truncate">
          {path[path.length - 1].name}
        </h2>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Grid size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <ListIcon size={18} />
          </Button>

          <div className="hidden sm:block w-px h-6 bg-border mx-2" />

          {/* TRIGGER MODAL */}
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
            loadingText="Uploading..."
          >
            <Upload size={18} /> Upload
          </Button>
        </div>
      </div>

      {/* C. CONTENT AREA (GRID) */}
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
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onNavigate={handleFolderClick}
                      onAction={(f) => console.log("Menu for", f.name)}
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
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onAction={(f) => console.log("Menu for", f.name)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              folders.length === 0 && (
                <div className="text-center py-24 bg-bg-main/40 rounded-4xl border-2 border-dashed border-border/60">
                  <p className="text-text-secondary">This folder is empty.</p>
                </div>
              )
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
    </div>
  );
};

export default Dashboard;

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
