import React from "react";
import { Filter } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "image", label: "Images" },
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Documents" },
  { value: "excel", label: "Spreadsheets" },
  { value: "ppt", label: "Presentations" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "text", label: "Text" },
];

const TypeFilter = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2 bg-bg-main border border-border rounded-xl px-3 py-1.5">
      <Filter size={13} className="text-text-secondary shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-bold text-text-secondary bg-transparent outline-none cursor-pointer"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TypeFilter;
