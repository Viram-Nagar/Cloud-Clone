import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText, // New Prop for dynamic text
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl";

  const variants = {
    primary: "bg-brand-gradient text-white shadow-lg hover:opacity-90",
    secondary:
      "bg-surface border border-border text-text-secondary hover:border-brand-blue hover:text-brand-blue shadow-sm",
    danger:
      "bg-red-50 border border-red-100 text-error hover:bg-error hover:text-white",
    ghost:
      "bg-transparent text-text-secondary hover:bg-bg-main hover:text-brand-blue",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {/* Dynamic loading text or nothing (for icon-only buttons) */}
          {loadingText && <span>{loadingText}</span>}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

// import React from "react";

// const Button = ({
//   children,
//   variant = "primary",
//   size = "md",
//   isLoading = false,
//   className = "",
//   ...props
// }) => {
//   // Base Styles: Consistent padding, transitions, and font weight
//   const baseStyles =
//     "inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl";

//   // Variant Styles: Using our index.css theme variables
//   const variants = {
//     primary: "bg-brand-gradient text-white shadow-lg hover:opacity-90",
//     secondary:
//       "bg-surface border border-border text-text-secondary hover:border-brand-blue hover:text-brand-blue shadow-sm",
//     danger:
//       "bg-red-50 border border-red-100 text-error hover:bg-error hover:text-white",
//     ghost:
//       "bg-transparent text-text-secondary hover:bg-bg-main hover:text-brand-blue",
//   };

//   // Size Styles
//   const sizes = {
//     sm: "px-3 py-1.5 text-xs",
//     md: "px-5 py-2.5 text-sm",
//     lg: "px-8 py-4 text-base",
//   };

//   return (
//     <button
//       className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
//       disabled={isLoading || props.disabled}
//       {...props}
//     >
//       {isLoading ? (
//         <div className="flex items-center gap-2">
//           <svg
//             className="animate-spin h-5 w-5 text-current"
//             viewBox="0 0 24 24"
//           >
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//               fill="none"
//             />
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//             />
//           </svg>
//           <span>Processing...</span>
//         </div>
//       ) : (
//         children
//       )}
//     </button>
//   );
// };

// export default Button;
