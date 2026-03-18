import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api.jsx";
import Button from "../components/ui/Button";
import FileIcon from "../components/ui/FileIcon";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { Download, Lock, Cloud } from "lucide-react";

const PublicShare = () => {
  const { token } = useParams();

  const [status, setStatus] = useState("loading");
  // loading | password_required | granted | expired | error

  const [resource, setResource] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // --- 1. Fetch resource on load ---
  useEffect(() => {
    fetchResource();
  }, [token]);

  const fetchResource = async (pwd = "") => {
    try {
      const params = pwd ? { password: pwd } : {};
      const res = await API.get(`/shares/public/${token}`, { params });
      setResource(res.data.data);
      setStatus("granted");
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401 && data?.passwordRequired) {
        setStatus("password_required");
      } else if (status === 401) {
        setPasswordError("Incorrect password. Try again.");
        setIsChecking(false);
      } else if (status === 410) {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    }
  };

  // --- 2. Submit password ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsChecking(true);
    setPasswordError("");
    await fetchResource(password);
    setIsChecking(false);
  };

  // --- 3. Download file ---
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await API.get(`/shares/public/download/${token}`);
      window.open(res.data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 font-inter">
      {/* Brand */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="bg-brand-gradient p-2 rounded-xl text-white">
          <Cloud size={20} fill="currentColor" />
        </div>
        <span className="text-lg font-black text-brand-gradient">
          CloudClone
        </span>
      </div>

      <Card className="w-full max-w-md shadow-2xl">
        {/* LOADING */}
        {status === "loading" && (
          <div className="flex flex-col items-center py-12 gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full" />
            <p className="text-text-secondary font-medium">
              Loading shared file...
            </p>
          </div>
        )}

        {/* PASSWORD REQUIRED */}
        {status === "password_required" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-4 bg-brand-blue/10 rounded-2xl">
                <Lock size={32} className="text-brand-blue" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Password Required
              </h2>
              <p className="text-sm text-text-secondary">
                This file is password protected.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Enter Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                autoFocus
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isChecking}
                loadingText="Checking..."
              >
                Unlock
              </Button>
            </form>
          </div>
        )}

        {/* ACCESS GRANTED */}
        {status === "granted" && resource && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                Shared with you
              </p>
              <h2 className="text-xl font-bold text-text-primary truncate">
                {resource.name}
              </h2>
            </div>

            <div className="flex justify-center">
              <div className="p-6 bg-bg-main rounded-3xl border border-border">
                <FileIcon fileName={resource.name} size={48} />
              </div>
            </div>

            {resource.fileId && (
              <Button
                variant="primary"
                className="w-full gap-2"
                onClick={handleDownload}
                isLoading={isDownloading}
                loadingText="Preparing download..."
              >
                <Download size={16} />
                Download File
              </Button>
            )}

            {resource.folderId && (
              <p className="text-center text-sm text-text-secondary">
                Folder sharing preview — download coming soon.
              </p>
            )}
          </div>
        )}

        {/* EXPIRED */}
        {status === "expired" && (
          <div className="flex flex-col items-center py-12 gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-2xl">
              <Lock size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              Link Expired
            </h2>
            <p className="text-sm text-text-secondary">
              This sharing link has expired and is no longer valid.
            </p>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="flex flex-col items-center py-12 gap-4 text-center">
            <h2 className="text-xl font-bold text-text-primary">
              Link Not Found
            </h2>
            <p className="text-sm text-text-secondary">
              This link is invalid or has been removed.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PublicShare;
