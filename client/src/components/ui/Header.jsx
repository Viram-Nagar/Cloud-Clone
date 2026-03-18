import React, { useState } from "react";
import { Search, Plus, Menu, X } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import Button from "./Button";
import Input from "./Input";
import Sidebar from "./Sidebar";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock path - this will be dynamic later
  const currentPaths = [{ name: "My Drive", path: "/dashboard" }];

  return (
    <div className="flex items-center justify-between w-full h-full gap-4">
      {/* 1. Mobile Menu Trigger */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden p-2"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu size={24} />
      </Button>

      {/* 2. Left: Breadcrumbs (Hidden on tiny phones) */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <Breadcrumbs paths={currentPaths} />
      </div>

      {/* 3. Middle: Search Bar (Desktop Only) */}
      <div className="hidden lg:block flex-1 max-w-xl">
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-blue transition-colors z-10"
          />
          <Input placeholder="Search your files..." className="pl-12 py-2" />
        </div>
      </div>

      {/* 4. Right: Primary Actions (The code you asked for) */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="primary"
          size="md"
          className="gap-2 shadow-brand-blue/30"
          loadingText="uploading..."
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>

      {/* 5. Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-100 md:hidden">
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
