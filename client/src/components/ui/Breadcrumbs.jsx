// src/components/ui/Breadcrumbs.jsx
import React from "react";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumbs = ({ items = [], className = "" }) => {
  return (
    <nav
      className={`flex items-center space-x-2 text-sm font-medium ${className}`}
    >
      {/* 1. Static Root */}
      <button
        onClick={() => items[0]?.onClick()} // Trigger the first item (My Drive)
        className="text-text-secondary hover:text-brand-blue transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
      >
        <Home size={16} />
        <span className="hidden md:inline">My Drive</span>
      </button>

      {/* 2. Dynamic Paths (Skip the first one since we handled it above) */}
      {items.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-text-secondary/40" />
          <button
            onClick={item.onClick}
            disabled={index === items.length - 2} // Disable if it's the last item
            className={`transition-colors truncate max-w-[120px] bg-transparent border-none text-left ${
              index === items.length - 2
                ? "text-text-primary font-bold cursor-default"
                : "text-text-secondary hover:text-brand-blue cursor-pointer"
            }`}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;

// import React from "react";
// import { Link } from "react-router-dom";
// import { ChevronRight, Home } from "lucide-react";

// const Breadcrumbs = ({ paths = [], className = "" }) => {
//   return (
//     <nav
//       className={`flex items-center space-x-2 text-sm font-medium ${className}`}
//     >
//       {/* 1. Static "Home" Root - Always there */}
//       <Link
//         to="/dashboard"
//         className="text-text-secondary hover:text-brand-blue transition-colors flex items-center gap-1"
//       >
//         <Home size={16} />
//         <span className="hidden md:inline">My Drive</span>
//       </Link>

//       {/* 2. Dynamic Paths - Mapped from props */}
//       {paths.map((item, index) => (
//         <React.Fragment key={index}>
//           {/* Separator Icon */}
//           <ChevronRight size={14} className="text-text-secondary/40" />

//           <Link
//             to={item.path}
//             className={`transition-colors truncate max-w-30 ${
//               index === paths.length - 1
//                 ? "text-text-primary font-bold cursor-default pointer-events-none" // Current folder
//                 : "text-text-secondary hover:text-brand-blue" // Parent folders
//             }`}
//           >
//             {item.name}
//           </Link>
//         </React.Fragment>
//       ))}
//     </nav>
//   );
// };

// export default Breadcrumbs;
