import React, { useEffect } from "react";
import { X } from "lucide-react";
import Card from "./Card";
import Button from "./Button";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <Card
        className={`relative w-full ${maxWidth} shadow-2xl animate-in zoom-in-95 duration-200 p-0 overflow-hidden`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold text-text-primary">{title}</h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:bg-bg-main transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="p-6">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 bg-bg-main/50 border-t border-border">
            {footer}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Modal;
