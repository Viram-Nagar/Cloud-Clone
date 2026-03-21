import React from "react";

const ProgressBar = ({ progress = 0, label, subLabel, className = "" }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {(label || subLabel) && (
        <div className="flex justify-between items-end px-1">
          {label && (
            <span className="text-xs font-bold text-text-primary">{label}</span>
          )}
          {subLabel && (
            <span className="text-[10px] font-medium text-text-secondary">
              {subLabel}
            </span>
          )}
        </div>
      )}

      <div className="h-2 w-full bg-bg-main rounded-full overflow-hidden border border-border/30">
        <div
          className="h-full bg-brand-gradient transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
