import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumbs = ({ paths = [], className = "" }) => {
  return (
    <nav
      className={`flex items-center space-x-2 text-sm font-medium ${className}`}
    >
      {/* 1. Static "Home" Root - Always there */}
      <Link
        to="/dashboard"
        className="text-text-secondary hover:text-brand-blue transition-colors flex items-center gap-1"
      >
        <Home size={16} />
        <span className="hidden md:inline">My Drive</span>
      </Link>

      {/* 2. Dynamic Paths - Mapped from props */}
      {paths.map((item, index) => (
        <React.Fragment key={index}>
          {/* Separator Icon */}
          <ChevronRight size={14} className="text-text-secondary/40" />

          <Link
            to={item.path}
            className={`transition-colors truncate max-w-30 ${
              index === paths.length - 1
                ? "text-text-primary font-bold cursor-default pointer-events-none" // Current folder
                : "text-text-secondary hover:text-brand-blue" // Parent folders
            }`}
          >
            {item.name}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
