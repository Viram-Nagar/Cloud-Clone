import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";

const DroppableCrumb = ({ id, folderId, children, isLast }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `breadcrumb-${id}`,
    data: {
      type: "breadcrumb",
      folderId: folderId,
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
