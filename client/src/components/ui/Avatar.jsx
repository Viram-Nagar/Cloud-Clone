import React from "react";

const Avatar = ({ src, name, size = "md", className = "" }) => {
  // Logic: Extract initials (e.g., "John Doe" -> "JD")
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Size variations
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={`
      relative flex items-center justify-center rounded-full overflow-hidden border border-border shrink-0
      ${sizes[size]} ${className}
    `}
    >
      {src ? (
        // Scenario 1: Photo exists
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        // Scenario 2: Fallback to initials
        <div className="h-full w-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center uppercase">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
