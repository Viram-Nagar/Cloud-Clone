import React from "react";

const Input = ({
  label,
  error,
  type = "text",
  className = "",
  id,
  ...props
}) => {
  // Generate a unique ID if one isn't provided for accessibility
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* Label - Simple and bold */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-bold text-text-primary ml-1"
        >
          {label}
        </label>
      )}

      {/* Input Field */}
      <input
        id={inputId}
        type={type}
        className={`
          w-full px-5 py-3 rounded-xl border transition-all duration-200 outline-none
          bg-bg-main/50 text-text-primary placeholder:text-text-secondary/50
          
          hover:border-cadet-gray
          focus:bg-surface focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5
          
          ${error ? "border-error focus:border-error focus:ring-error/5" : "border-border"}
          
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      />

      {/* Error Message */}
      {error && (
        <span className="text-xs font-semibold text-error ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
