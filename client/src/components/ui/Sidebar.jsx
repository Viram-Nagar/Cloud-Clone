import React from "react";
import {
  HardDrive,
  Clock,
  Star,
  Trash2,
  Cloud,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NavItem from "./NavItem";
import ProgressBar from "./ProgressBar";
import Divider from "./Divider";
import Avatar from "./Avatar";
import Button from "./Button";

const Sidebar = ({ isMobile, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full p-6 relative bg-surface">
      {/* Mobile Close Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 md:hidden"
          onClick={onClose}
        >
          <X size={20} />
        </Button>
      )}

      {/* 1. Brand Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-brand-gradient p-2 rounded-xl text-white shadow-lg shadow-brand-blue/20">
          <Cloud size={24} fill="currentColor" />
        </div>
        <span className="text-xl font-black tracking-tight text-brand-gradient">
          CloudClone
        </span>
      </div>

      {/* 2. Navigation */}
      <nav
        className="flex-1 space-y-1"
        onClick={isMobile ? onClose : undefined}
      >
        <NavItem to="/dashboard" icon={HardDrive} label="My Drive" />
        <NavItem to="/recent" icon={Clock} label="Recent" />
        <NavItem to="/starred" icon={Star} label="Starred" />
        <NavItem to="/trash" icon={Trash2} label="Trash" />

        <Divider className="my-6 opacity-50" />

        <NavItem to="/settings" icon={Settings} label="Settings" />
      </nav>

      {/* 3. Storage indicator */}
      <div className="mb-8 px-2">
        <ProgressBar progress={65} label="Storage" subLabel="9.8 GB / 15 GB" />
        <p className="text-[10px] text-text-secondary mt-3 leading-relaxed">
          70% of your storage is full.{" "}
          <span className="text-brand-blue font-bold cursor-pointer hover:underline">
            Upgrade?
          </span>
        </p>
      </div>

      {/* 4. User & Logout Area */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar name={user?.name} src={user?.avatarUrl} size="md" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-text-primary truncate">
              {user?.name || "User"}
            </span>
            <span className="text-[10px] text-text-secondary truncate">
              {user?.email}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 px-4 text-text-secondary hover:text-error hover:bg-red-50 group"
        >
          <LogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
