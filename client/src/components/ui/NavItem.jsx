import React from "react";
import { NavLink } from "react-router-dom";

const NavItem = ({ to, icon: Icon, label, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        
        flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 group
        
        ${
          isActive
            ? "bg-brand-gradient text-white shadow-md shadow-brand-blue/20"
            : "text-text-secondary hover:bg-bg-main hover:text-brand-blue"
        }
      `}
    >
      <Icon
        size={20}
        className="transition-transform duration-300 group-hover:scale-110"
      />

      <span className="text-sm tracking-wide">{label}</span>
    </NavLink>
  );
};

export default NavItem;
