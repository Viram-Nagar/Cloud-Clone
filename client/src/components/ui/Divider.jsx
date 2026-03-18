import React from "react";

const Divider = ({ orientation = "horizontal", className = "" }) => {
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className={`
        bg-border/60 shrink-0
        ${isHorizontal ? "h-px w-full my-4" : "w-px h-full mx-4"} 
        ${className}
      `}
    />
  );
};

export default Divider;
