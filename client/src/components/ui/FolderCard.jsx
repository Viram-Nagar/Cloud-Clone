import React, { useState } from "react";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Card from "./Card";
import Button from "./Button";
import ContextMenu from "./ContextMenu";

const FolderCard = ({ folder, onNavigate, onAction }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    {
      label: "Rename",
      icon: Pencil,
      onClick: () => onAction(folder, "rename"),
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: () => onAction(folder, "delete"),
      variant: "danger",
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="cursor-pointer"
      onClick={() => onNavigate(folder.id, folder.name)}
    >
      <Card className="group p-4 hover:shadow-xl transition-all border-border/60 hover:border-brand-blue/30 bg-surface relative">
        <div className="flex items-center justify-between">
          {/* Folder Icon & Name */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-brand-blue/10 rounded-xl group-hover:bg-brand-blue/20 transition-colors">
              <Folder
                size={24}
                className="text-brand-blue fill-brand-blue/20"
              />
            </div>
            <h4
              className="text-sm font-bold text-text-primary truncate"
              title={folder.name}
            >
              {folder.name}
            </h4>
          </div>

          {/* MoreVertical trigger */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation(); // prevent folder navigation
                setIsMenuOpen((prev) => !prev);
              }}
            >
              <MoreVertical size={16} />
            </Button>

            <ContextMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              items={menuItems}
            />
          </div>
        </div>

        {folder.itemCount !== undefined && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
              {folder.itemCount} Items
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default FolderCard;

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
