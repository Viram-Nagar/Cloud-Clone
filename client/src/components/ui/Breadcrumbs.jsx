import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

// --- Single droppable breadcrumb item ---
const DroppableCrumb = ({ id, folderId, children, isLast }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `breadcrumb-${id}`,
    data: {
      type: "breadcrumb",
      folderId: folderId, // null = root, uuid = specific folder
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ pointerEvents: "all" }}
      className={`
      flex items-center px-4 py-2 rounded-xl transition-all duration-150 min-w-[60px] justify-center
      ${
        isOver
          ? "bg-brand-blue/10 ring-2 ring-brand-blue/40 scale-105"
          : "bg-transparent hover:bg-bg-main"
      }
    `}
    >
      {/* Drop indicator */}
      {isOver && (
        <span className="text-[10px] font-bold text-brand-blue mr-1">
          Move here →
        </span>
      )}
      {children}
    </div>
  );
};

const Breadcrumbs = ({ paths = [], items = [], className = "" }) => {
  // Support both 'paths' prop and 'items' prop
  const crumbs =
    items.length > 0
      ? items.map((item, idx) => ({
          name: item.label,
          path: "#",
          onClick: item.onClick,
          id: idx,
          folderId: item.folderId ?? null,
        }))
      : paths.map((p, idx) => ({
          name: p.name,
          path: p.path || "#",
          onClick: p.onClick,
          id: idx,
          folderId: p.folderId ?? null,
        }));

  return (
    <nav
      className={`flex items-center gap-1 text-sm font-medium flex-wrap ${className}`}
    >
      {/* Root "My Drive" — always droppable */}
      <DroppableCrumb id="root" folderId={null}>
        <Link
          to="/dashboard"
          className="text-text-secondary hover:text-brand-blue transition-colors flex items-center gap-1"
          onClick={(e) => {
            if (crumbs.length > 0 && crumbs[0].onClick) {
              e.preventDefault();
              crumbs[0].onClick();
            }
          }}
        >
          <Home size={16} />
          <span className="hidden md:inline">My Drive</span>
        </Link>
      </DroppableCrumb>

      {/* Dynamic crumbs — skip first if it's "My Drive" */}
      {crumbs
        .filter((c) => c.name !== "My Drive")
        .map((crumb, index, filtered) => {
          const isLast = index === filtered.length - 1;
          return (
            <React.Fragment key={crumb.id}>
              <ChevronRight
                size={14}
                className="text-text-secondary/40 shrink-0"
              />
              <DroppableCrumb
                id={crumb.id}
                folderId={crumb.folderId}
                isLast={isLast}
              >
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className={`transition-colors truncate max-w-[120px] ${
                      isLast
                        ? "text-text-primary font-bold cursor-default"
                        : "text-text-secondary hover:text-brand-blue"
                    }`}
                    style={isLast ? { pointerEvents: "none" } : {}}
                  >
                    {crumb.name}
                  </button>
                ) : (
                  <Link
                    to={crumb.path}
                    className={`transition-colors truncate max-w-[120px] ${
                      isLast
                        ? "text-text-primary font-bold cursor-default pointer-events-none"
                        : "text-text-secondary hover:text-brand-blue"
                    }`}
                  >
                    {crumb.name}
                  </Link>
                )}
              </DroppableCrumb>
            </React.Fragment>
          );
        })}
    </nav>
  );
};

export default Breadcrumbs;

// // src/components/ui/Breadcrumbs.jsx
// import React from "react";
// import { ChevronRight, Home } from "lucide-react";

// const Breadcrumbs = ({ items = [], className = "" }) => {
//   return (
//     <nav
//       className={`flex items-center space-x-2 text-sm font-medium ${className}`}
//     >
//       {/* 1. Static Root */}
//       <button
//         onClick={() => items[0]?.onClick()} // Trigger the first item (My Drive)
//         className="text-text-secondary hover:text-brand-blue transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
//       >
//         <Home size={16} />
//         <span className="hidden md:inline">My Drive</span>
//       </button>

//       {/* 2. Dynamic Paths (Skip the first one since we handled it above) */}
//       {items.slice(1).map((item, index) => (
//         <React.Fragment key={index}>
//           <ChevronRight size={14} className="text-text-secondary/40" />
//           <button
//             onClick={item.onClick}
//             disabled={index === items.length - 2} // Disable if it's the last item
//             className={`transition-colors truncate max-w-[120px] bg-transparent border-none text-left ${
//               index === items.length - 2
//                 ? "text-text-primary font-bold cursor-default"
//                 : "text-text-secondary hover:text-brand-blue cursor-pointer"
//             }`}
//           >
//             {item.label}
//           </button>
//         </React.Fragment>
//       ))}
//     </nav>
//   );
// };

// export default Breadcrumbs;

// import React from "react";
// import { Link } from "react-router-dom";
// import { ChevronRight, Home } from "lucide-react";

// const Breadcrumbs = ({ paths = [], className = "" }) => {
//   return (
//     <nav
//       className={`flex items-center space-x-2 text-sm font-medium ${className}`}
//     >
//       {/* 1. Static "Home" Root - Always there */}
//       <Link
//         to="/dashboard"
//         className="text-text-secondary hover:text-brand-blue transition-colors flex items-center gap-1"
//       >
//         <Home size={16} />
//         <span className="hidden md:inline">My Drive</span>
//       </Link>

//       {/* 2. Dynamic Paths - Mapped from props */}
//       {paths.map((item, index) => (
//         <React.Fragment key={index}>
//           {/* Separator Icon */}
//           <ChevronRight size={14} className="text-text-secondary/40" />

//           <Link
//             to={item.path}
//             className={`transition-colors truncate max-w-30 ${
//               index === paths.length - 1
//                 ? "text-text-primary font-bold cursor-default pointer-events-none" // Current folder
//                 : "text-text-secondary hover:text-brand-blue" // Parent folders
//             }`}
//           >
//             {item.name}
//           </Link>
//         </React.Fragment>
//       ))}
//     </nav>
//   );
// };

// export default Breadcrumbs;
