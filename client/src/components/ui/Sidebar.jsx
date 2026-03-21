import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Clock,
  Star,
  Trash2,
  Cloud,
  Settings,
  LogOut,
  X,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NavItem from "./NavItem";
import ProgressBar from "./ProgressBar";
import Divider from "./Divider";
import Avatar from "./Avatar";
import Button from "./Button";
import API from "../../api.jsx";

const Sidebar = ({ isMobile, onClose }) => {
  const { user, logout } = useAuth();
  const [storageStats, setStorageStats] = useState({
    usedBytes: 0,
    totalLimit: 100 * 1024 * 1024,
    percentage: 0,
  });

  const fetchStorageStats = async () => {
    try {
      const res = await API.get("/files/storage-stats");
      setStorageStats(res.data);
    } catch (err) {
      console.error("Storage stats error:", err);
    }
  };

  useEffect(() => {
    fetchStorageStats();
    window.addEventListener("storage-updated", fetchStorageStats);
    return () =>
      window.removeEventListener("storage-updated", fetchStorageStats);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 MB";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const usedFormatted = formatBytes(storageStats.usedBytes);
  const totalFormatted = formatBytes(storageStats.totalLimit);
  const percentage = parseFloat(storageStats.percentage) || 0;

  // Color changes when near limit
  const isWarning = percentage >= 80;
  const isFull = percentage >= 100;

  return (
    <div className="flex flex-col h-full p-6 relative bg-surface">
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

      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-brand-gradient p-2 rounded-xl text-white shadow-lg shadow-brand-blue/20">
          <Cloud size={24} fill="currentColor" />
        </div>
        <span className="text-xl font-black tracking-tight text-brand-gradient">
          CloudClone
        </span>
      </div>

      <nav
        className="flex-1 space-y-1"
        onClick={isMobile ? onClose : undefined}
      >
        <NavItem to="/dashboard" icon={HardDrive} label="My Drive" />
        <NavItem to="/recent" icon={Clock} label="Recent" />
        <NavItem to="/starred" icon={Star} label="Starred" />
        <NavItem to="/shared" icon={Users} label="Shared with me" />
        <NavItem to="/trash" icon={Trash2} label="Trash" />

        <Divider className="my-6 opacity-50" />
      </nav>

      <div className="mb-8 px-2">
        <ProgressBar
          progress={Math.min(percentage, 100)}
          label="Storage"
          subLabel={`${usedFormatted} / ${totalFormatted}`}
        />
        <p
          className={`text-[10px] mt-3 leading-relaxed ${
            isFull
              ? "text-red-500"
              : isWarning
                ? "text-orange-400"
                : "text-text-secondary"
          }`}
        >
          {isFull
            ? "Storage full! Delete files to upload more."
            : isWarning
              ? `${percentage}% used. Running low on space.`
              : `${percentage}% of your storage is used.`}
        </p>
      </div>

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
