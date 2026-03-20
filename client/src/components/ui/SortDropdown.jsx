import React from "react";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "size-asc", label: "Size ↑" },
  { value: "size-desc", label: "Size ↓" },
  { value: "date-asc", label: "Date ↑" },
  { value: "date-desc", label: "Date ↓" },
];

const SortDropdown = ({ sortBy, sortOrder, onChange }) => {
  const value = `${sortBy}-${sortOrder}`;

  return (
    <div className="flex items-center gap-2 bg-bg-main border border-border rounded-xl px-3 py-1.5">
      <ArrowUpDown size={13} className="text-text-secondary shrink-0" />
      <select
        value={value}
        onChange={(e) => {
          const [key, order] = e.target.value.split("-");
          onChange(key, order);
        }}
        className="text-xs font-bold text-text-secondary bg-transparent outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortDropdown;
