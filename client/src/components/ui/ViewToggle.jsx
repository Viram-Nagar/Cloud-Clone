import React from "react";
import { Grid, List } from "lucide-react";

const ViewToggle = ({ viewMode, onToggle }) => {
  return (
    <div className="flex items-center gap-1 bg-bg-main border border-border rounded-xl p-1">
      <button
        onClick={() => onToggle("grid")}
        className={`p-1.5 rounded-lg transition-all duration-150 ${
          viewMode === "grid"
            ? "bg-surface text-text-primary shadow-sm border border-border"
            : "text-text-secondary hover:text-text-primary"
        }`}
        title="Grid view"
      >
        <Grid size={15} />
      </button>
      <button
        onClick={() => onToggle("list")}
        className={`p-1.5 rounded-lg transition-all duration-150 ${
          viewMode === "list"
            ? "bg-surface text-text-primary shadow-sm border border-border"
            : "text-text-secondary hover:text-text-primary"
        }`}
        title="List view"
      >
        <List size={15} />
      </button>
    </div>
  );
};

export default ViewToggle;
