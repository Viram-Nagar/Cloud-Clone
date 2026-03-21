import { useState } from "react";

const useViewPreference = (key = "viewMode") => {
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(key) || "grid",
  );

  const toggleView = (mode) => {
    setViewMode(mode);
    localStorage.setItem(key, mode);
  };

  return { viewMode, toggleView };
};

export default useViewPreference;
