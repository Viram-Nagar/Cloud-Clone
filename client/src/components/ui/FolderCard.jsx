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

  // Sync star state when folder prop changes
  useEffect(() => {
    setIsStarred(folder.is_starred || false);
  }, [folder.is_starred]);

  // --- Draggable setup (folder can be dragged into other folders) ---
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

  // --- Droppable setup (files/folders can be dropped onto this folder) ---
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `droppable-folder-${folder.id}`,
    data: {
      type: "folder",
      folderId: folder.id,
    },
  });

  // --- Combine both refs ---
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
      onStarToggle?.();
    } catch (err) {
      setIsStarred((prev) => !prev);
      toast.error("Failed to update star");
      console.error("Star toggle failed:", err);
    } finally {
      setIsStarring(false);
    }
  };

  // const handleStarToggle = async (e) => {
  //   e.stopPropagation();
  //   if (isStarring) return;
  //   setIsStarring(true);
  //   setIsStarred((prev) => !prev);
  //   try {
  //     await API.post("/files/stars/toggle", { folderId: folder.id });
  //     onStarToggle?.();
  //   } catch (err) {
  //     setIsStarred((prev) => !prev);
  //     console.error("Star toggle failed:", err);
  //   } finally {
  //     setIsStarring(false);
  //   }
  // };

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
      // --- Combined drag + drop ref + style ---
      ref={setRef}
      style={dragStyle}
      className="cursor-pointer relative"
      // --- Click navigates ONLY if not dragging ---
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
        {/* Icon area — drag handle */}
        <div className="relative" {...listeners} {...attributes}>
          {/* Big Folder Icon */}
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

          {/* Drop indicator label */}
          {isOver && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
              <span className="text-xs font-bold text-brand-blue bg-surface/90 px-2 py-1 rounded-lg">
                Move here
              </span>
            </div>
          )}

          {/* Star button */}
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

          {/* 3 dots menu */}
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

        {/* Folder name */}
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

// import React, { useState } from "react";
// import { Folder, MoreVertical, Pencil, Trash2, Star } from "lucide-react";
// import { motion } from "framer-motion";
// import Card from "./Card";
// import Button from "./Button";
// import ContextMenu from "./ContextMenu";
// import API from "../../api.jsx";

// const FolderCard = ({ folder, onNavigate, onAction, onStarToggle }) => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isStarred, setIsStarred] = useState(folder.is_starred || false);
//   const [isStarring, setIsStarring] = useState(false);

//   const handleStarToggle = async (e) => {
//     e.stopPropagation();
//     if (isStarring) return;
//     setIsStarring(true);
//     setIsStarred((prev) => !prev);
//     try {
//       await API.post("/files/stars/toggle", { folderId: folder.id });
//       onStarToggle?.();
//     } catch (err) {
//       setIsStarred((prev) => !prev);
//       console.error("Star toggle failed:", err);
//     } finally {
//       setIsStarring(false);
//     }
//   };

//   const menuItems = [
//     {
//       label: "Rename",
//       icon: Pencil,
//       onClick: () => onAction?.(folder, "rename"),
//     },
//     {
//       label: "Delete",
//       icon: Trash2,
//       onClick: () => onAction?.(folder, "delete"),
//       variant: "danger",
//     },
//   ];

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       whileTap={{ scale: 0.98 }}
//       transition={{ duration: 0.2 }}
//       className="cursor-pointer relative"
//       onClick={() => onNavigate?.(folder.id, folder.name)}
//     >
//       <Card
//         className={`group hover:shadow-xl transition-all border-border/60 hover:border-brand-blue/30 bg-surface ${isMenuOpen ? "z-20" : ""}`}
//       >
//         {/* Icon area with overlaid buttons */}
//         <div className="relative">
//           {/* Big Folder Icon — centered */}
//           <div
//             className="flex items-center justify-center bg-brand-blue/5 rounded-2xl group-hover:bg-brand-blue/10 transition-colors"
//             style={{ aspectRatio: "1/1" }}
//           >
//             <Folder size={64} className="text-brand-blue fill-brand-blue/30" />
//           </div>

//           {/* Star button — top left overlay */}
//           <button
//             onClick={handleStarToggle}
//             disabled={isStarring}
//             className="absolute top-2 left-2 p-1.5 bg-surface/80 backdrop-blur-sm rounded-lg hover:bg-yellow-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
//             title={isStarred ? "Remove from starred" : "Add to starred"}
//           >
//             <Star
//               size={13}
//               className={`transition-colors ${
//                 isStarred
//                   ? "fill-yellow-400 text-yellow-400"
//                   : "text-text-secondary/50 hover:text-yellow-400"
//               }`}
//             />
//           </button>

//           {/* MoreVertical — top right overlay */}
//           <div className="absolute top-2 right-2">
//             <Button
//               variant="ghost"
//               size="sm"
//               className="p-1 bg-surface/80 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setIsMenuOpen((prev) => !prev);
//               }}
//             >
//               <MoreVertical size={14} />
//             </Button>

//             <ContextMenu
//               isOpen={isMenuOpen}
//               onClose={() => setIsMenuOpen(false)}
//               items={menuItems}
//             />
//           </div>
//         </div>

//         {/* Folder name — below icon */}
//         <div className="h-10 flex items-center justify-center px-1">
//           <h4
//             className="text-sm font-bold text-text-primary truncate text-center w-full"
//             title={folder.name}
//           >
//             {folder.name}
//           </h4>
//           {folder.itemCount !== undefined && (
//             <p className="text-[10px] text-text-secondary text-center mt-0.5">
//               {folder.itemCount} items
//             </p>
//           )}
//         </div>
//       </Card>
//     </motion.div>
//   );
// };

// export default FolderCard;

// import React, { useState } from "react";
// import { Folder, MoreVertical, Pencil, Trash2, Star } from "lucide-react";
// import { motion } from "framer-motion";
// import Card from "./Card";
// import Button from "./Button";
// import ContextMenu from "./ContextMenu";
// import API from "../../api.jsx";

// const FolderCard = ({ folder, onNavigate, onAction, onStarToggle }) => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isStarred, setIsStarred] = useState(folder.is_starred || false);
//   const [isStarring, setIsStarring] = useState(false);

//   // --- Star toggle handler ---
//   const handleStarToggle = async (e) => {
//     e.stopPropagation(); // prevent folder navigation
//     if (isStarring) return;
//     setIsStarring(true);

//     // Optimistic update
//     setIsStarred((prev) => !prev);

//     try {
//       await API.post("/files/stars/toggle", {
//         folderId: folder.id,
//       });
//       onStarToggle?.();
//     } catch (err) {
//       // Revert on error
//       setIsStarred((prev) => !prev);
//       console.error("Star toggle failed:", err);
//     } finally {
//       setIsStarring(false);
//     }
//   };

//   const menuItems = [
//     {
//       label: "Rename",
//       icon: Pencil,
//       onClick: () => onAction?.(folder, "rename"),
//     },
//     {
//       label: "Delete",
//       icon: Trash2,
//       onClick: () => onAction?.(folder, "delete"),
//       variant: "danger",
//     },
//   ];

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       whileTap={{ scale: 0.98 }}
//       transition={{ duration: 0.2 }}
//       className="cursor-pointer relative"
//       onClick={() => onNavigate?.(folder.id, folder.name)}
//     >
//       <Card
//         className={`group hover:shadow-xl transition-all border-border/60 hover:border-brand-blue/30 bg-surface ${isMenuOpen ? "z-20" : ""}`}
//       >
//         <div className="flex items-center justify-between">
//           {/* Folder Icon & Name */}
//           {/* <div className="flex items-center gap-3 overflow-hidden">
//             <div className="p-2.5 bg-brand-blue/10 rounded-xl group-hover:bg-brand-blue/20 transition-colors">
//               <Folder
//                 size={24}
//                 className="text-brand-blue fill-brand-blue/20"
//               />
//             </div>
//             <h4
//               className="text-sm font-bold text-text-primary truncate"
//               title={folder.name}
//             >
//               {folder.name}
//             </h4>
//           </div> */}

//           <div className="flex items-center gap-2 min-w-0 flex-1">
//             <div className="p-2 bg-brand-blue/10 rounded-lg group-hover:bg-brand-blue/20 transition-colors shrink-0">
//               <Folder
//                 size={18}
//                 className="text-brand-blue fill-brand-blue/20"
//               />
//             </div>
//             <h4
//               className="text-sm font-bold text-text-primary truncate"
//               title={folder.name}
//             >
//               {folder.name}
//             </h4>
//           </div>

//           {/* Right side: Star + MoreVertical */}

//           {/* Right side: Star + MoreVertical */}
//           <div className="flex items-center gap-0.5 shrink-0">
//             {/* STAR BUTTON */}
//             <button
//               onClick={handleStarToggle}
//               disabled={isStarring}
//               className="p-1.5 rounded-lg hover:bg-yellow-50 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
//               title={isStarred ? "Remove from starred" : "Add to starred"}
//             >
//               <Star
//                 size={13}
//                 className={`transition-colors ${
//                   isStarred
//                     ? "fill-yellow-400 text-yellow-400 opacity-100!"
//                     : "text-text-secondary/40 hover:text-yellow-400"
//                 }`}
//               />
//             </button>

//             {/* MoreVertical trigger */}
//             <div className="relative">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setIsMenuOpen((prev) => !prev);
//                 }}
//               >
//                 <MoreVertical size={16} />
//               </Button>

//               <ContextMenu
//                 isOpen={isMenuOpen}
//                 onClose={() => setIsMenuOpen(false)}
//                 items={menuItems}
//               />
//             </div>
//           </div>
//         </div>

//         {folder.itemCount !== undefined && (
//           <div className="mt-3 pt-3 border-t border-border/40">
//             <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
//               {folder.itemCount} Items
//             </span>
//           </div>
//         )}
//       </Card>
//     </motion.div>
//   );
// };

// export default FolderCard;

// import React, { useState } from "react";
// import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
// import { motion } from "framer-motion";
// import Card from "./Card";
// import Button from "./Button";
// import ContextMenu from "./ContextMenu";

// const FolderCard = ({ folder, onNavigate, onAction }) => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   const menuItems = [
//     {
//       label: "Rename",
//       icon: Pencil,
//       onClick: () => onAction(folder, "rename"),
//     },
//     {
//       label: "Delete",
//       icon: Trash2,
//       onClick: () => onAction(folder, "delete"),
//       variant: "danger",
//     },
//   ];

//   return (
//     // <motion.div
//     //   layout
//     //   initial={{ opacity: 0, scale: 0.9 }}
//     //   animate={{ opacity: 1, scale: 1 }}
//     //   whileHover={{ y: -4 }}
//     //   whileTap={{ scale: 0.98 }}
//     //   transition={{ duration: 0.2 }}
//     //   className="cursor-pointer"
//     //   onClick={() => onNavigate(folder.id, folder.name)}
//     // >
//     //   <Card
//     //     className={`group p-4 hover:shadow-xl transition-all border-border/60 hover:border-brand-blue/30 bg-surface relative ${isMenuOpen ? "z-20" : "z-0"}`}
//     //   >
//     //     <div className="flex items-center justify-between">
//     //       {/* Folder Icon & Name */}
//     //       <div className="flex items-center gap-3 overflow-hidden">
//     //         <div className="p-2.5 bg-brand-blue/10 rounded-xl group-hover:bg-brand-blue/20 transition-colors">
//     //           <Folder
//     //             size={24}
//     //             className="text-brand-blue fill-brand-blue/20"
//     //           />
//     //         </div>
//     //         <h4
//     //           className="text-sm font-bold text-text-primary truncate"
//     //           title={folder.name}
//     //         >
//     //           {folder.name}
//     //         </h4>
//     //       </div>

//     //       {/* MoreVertical trigger */}
//     //       <div className="relative">
//     //         <Button
//     //           variant="ghost"
//     //           size="sm"
//     //           className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//     //           onClick={(e) => {
//     //             e.stopPropagation(); // prevent folder navigation
//     //             setIsMenuOpen((prev) => !prev);
//     //           }}
//     //         >
//     //           <MoreVertical size={16} />
//     //         </Button>

//     //         <ContextMenu
//     //           isOpen={isMenuOpen}
//     //           onClose={() => setIsMenuOpen(false)}
//     //           items={menuItems}
//     //         />
//     //       </div>
//     //     </div>

//     //     {folder.itemCount !== undefined && (
//     //       <div className="mt-3 pt-3 border-t border-border/40">
//     //         <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
//     //           {folder.itemCount} Items
//     //         </span>
//     //       </div>
//     //     )}
//     //   </Card>
//     // </motion.div>

//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       whileTap={{ scale: 0.98 }}
//       transition={{ duration: 0.2 }}
//       className="cursor-pointer relative" // relative moved HERE
//       onClick={() => onNavigate?.(folder.id, folder.name)}
//     >
//       <Card
//         className={`group p-4 hover:shadow-xl transition-all border-border/60 hover:border-brand-blue/30 bg-surface ${isMenuOpen ? "z-20" : ""}`}
//       >
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3 overflow-hidden">
//             <div className="p-2.5 bg-brand-blue/10 rounded-xl group-hover:bg-brand-blue/20 transition-colors">
//               <Folder
//                 size={24}
//                 className="text-brand-blue fill-brand-blue/20"
//               />
//             </div>
//             <h4
//               className="text-sm font-bold text-text-primary truncate"
//               title={folder.name}
//             >
//               {folder.name}
//             </h4>
//           </div>

//           <Button
//             variant="ghost"
//             size="sm"
//             className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//             onClick={(e) => {
//               e.stopPropagation();
//               setIsMenuOpen((prev) => !prev);
//             }}
//           >
//             <MoreVertical size={16} />
//           </Button>
//         </div>

//         {folder.itemCount !== undefined && (
//           <div className="mt-3 pt-3 border-t border-border/40">
//             <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
//               {folder.itemCount} Items
//             </span>
//           </div>
//         )}
//       </Card>

//       {/* ContextMenu is NOW outside Card, inside motion.div */}
//       <ContextMenu
//         isOpen={isMenuOpen}
//         onClose={() => setIsMenuOpen(false)}
//         items={menuItems}
//       />
//     </motion.div>
//   );
// };

// export default FolderCard;

// import React from "react";
// import { Folder, MoreVertical } from "lucide-react";
// import { motion } from "framer-motion";
// import Card from "./Card";
// import Button from "./Button";

// const FolderCard = ({ folder, onNavigate, onAction }) => {
//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, scale: 0.9 }}
//       animate={{ opacity: 1, scale: 1 }}
//       whileHover={{ y: -4 }}
//       whileTap={{ scale: 0.98 }}
//       transition={{ duration: 0.2 }}
//       className="cursor-pointer"
//       onClick={() => onNavigate(folder.id, folder.name)}
//     >
//       <Card className="group p-4 hover:shadow-xl transition-all border-border/60 hover:border-brand-blue/30 bg-surface">
//         <div className="flex items-center justify-between">
//           {/* Folder Icon & Name */}
//           <div className="flex items-center gap-3 overflow-hidden">
//             <div className="p-2.5 bg-brand-blue/10 rounded-xl group-hover:bg-brand-blue/20 transition-colors">
//               <Folder
//                 size={24}
//                 className="text-brand-blue fill-brand-blue/20"
//               />
//             </div>
//             <h4
//               className="text-sm font-bold text-text-primary truncate"
//               title={folder.name}
//             >
//               {folder.name}
//             </h4>
//           </div>

//           {/* Action Menu - Stop Propagation so clicking menu doesn't enter folder */}
//           <Button
//             variant="ghost"
//             size="sm"
//             className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//             onClick={(e) => {
//               e.stopPropagation();
//               onAction(folder);
//             }}
//           >
//             <MoreVertical size={16} />
//           </Button>
//         </div>

//         {/* Optional: Item Count (If your backend provides it later) */}
//         {folder.itemCount !== undefined && (
//           <div className="mt-3 pt-3 border-t border-border/40">
//             <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
//               {folder.itemCount} Items
//             </span>
//           </div>
//         )}
//       </Card>
//     </motion.div>
//   );
// };

// export default FolderCard;
