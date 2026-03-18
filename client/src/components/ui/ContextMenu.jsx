import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ContextMenu = ({ isOpen, onClose, items = [], className = "" }) => {
  const menuRef = useRef(null);

  // --- Close on outside click ---
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Small delay so the same click that opens doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // --- Close on ESC key ---
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -6 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`
            absolute right-0 top-8 z-50
            min-w-[160px] w-max
            bg-surface border border-border
            rounded-2xl shadow-xl shadow-text-primary/10
            py-1.5 overflow-hidden
            ${className}
          `}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            const isDanger = item.variant === "danger";

            return (
              <React.Fragment key={index}>
                {/* Divider before danger items */}
                {isDanger && index > 0 && (
                  <div className="h-px bg-border/60 my-1 mx-3" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    item.onClick();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5
                    text-sm font-semibold text-left
                    transition-colors duration-150
                    ${
                      isDanger
                        ? "text-red-500 hover:bg-red-50"
                        : "text-text-secondary hover:bg-bg-main hover:text-text-primary"
                    }
                  `}
                >
                  {Icon && (
                    <Icon
                      size={15}
                      className={`shrink-0 ${isDanger ? "text-red-400" : "text-text-secondary"}`}
                    />
                  )}
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContextMenu;
