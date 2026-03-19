import React, { useState } from "react";
import { Search, Upload, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Sidebar from "./Sidebar";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="flex items-center justify-between w-full h-full gap-4">
      {/* 1. Mobile Menu Trigger */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden p-2 shrink-0"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu size={24} />
      </Button>

      {/* 2. Search Bar — visible on ALL screen sizes now */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-blue transition-colors z-10"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your files..."
            className="
              w-full pl-11 pr-4 py-2.5 rounded-xl border border-border
              bg-bg-main text-text-primary placeholder:text-text-secondary/50
              hover:border-cadet-gray
              focus:bg-surface focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5
              outline-none transition-all duration-200 text-sm
            "
          />
        </div>
      </form>

      {/* 3. Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface shadow-2xl animate-in slide-in-from-left duration-300">
            <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
