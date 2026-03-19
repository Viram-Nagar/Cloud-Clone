import React from "react";

const Card = ({ children, className = "", noPadding = false }) => {
  return (
    <div
      className={`
    
      bg-surface border border-border 
    
      rounded-3xl shadow-sm
    
      ${noPadding ? "p-0" : "p-2"} 
    
      ${className}
    `}
    >
      {children}
    </div>
  );
};

export default Card;
