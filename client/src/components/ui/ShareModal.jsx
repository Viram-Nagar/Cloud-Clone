import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Link,
  Users,
  Trash2,
  Crown,
  Eye,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api.jsx";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";

const RoleBadge = ({ role }) => {
  const styles = {
    owner: {
      icon: Crown,
      label: "Owner",
      className: "bg-yellow-50 text-yellow-600",
    },
    editor: {
      icon: Pencil,
      label: "Editor",
      className: "bg-blue-50 text-brand-blue",
    },
    viewer: {
      icon: Eye,
      label: "Viewer",
      className: "bg-bg-main text-text-secondary",
    },
  };
  const { icon: Icon, label, className } = styles[role] || styles.viewer;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${className}`}
    >
      <Icon size={10} />
      {label}
    </span>
  );
};

const ShareModal = ({ isOpen, onClose, resource }) => {
  const [activeTab, setActiveTab] = useState("people");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [currentShares, setCurrentShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);

  const [publicLink, setPublicLink] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !resource) return;
    fetchShares();

    setEmail("");
    setRole("viewer");
    setShareError("");
    setPublicLink("");
    setLinkPassword("");
    setLinkExpiry("");
    setLinkError("");
    setActiveTab("people");
  }, [isOpen, resource]);

  const fetchShares = async () => {
    setLoadingShares(true);
    try {
      const res = await API.get(`/shares/${resource.type}/${resource.id}`);
      setCurrentShares(res.data.shares || []);
    } catch (err) {
      console.error("Failed to fetch shares:", err);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShareByEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSharing(true);
    setShareError("");

    try {
      await API.post("/shares/internal", {
        email: email.trim(),
        role,
        fileId: resource.type === "file" ? resource.id : undefined,
        folderId: resource.type === "folder" ? resource.id : undefined,
      });
      setEmail("");
      fetchShares();
      toast.success("Invite sent successfully");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to share. Check the email.";
      setShareError(msg);
      toast.error(msg);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (shareId) => {
    try {
      await API.delete(`/shares/${shareId}`);
      fetchShares();
      toast.success("Access revoked");
    } catch (err) {
      console.error("Revoke failed:", err);
      toast.error("Failed to revoke access");
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setLinkError("");
    try {
      const payload = {
        fileId: resource.type === "file" ? resource.id : undefined,
        folderId: resource.type === "folder" ? resource.id : undefined,
      };
      if (linkPassword.trim()) payload.password = linkPassword.trim();
      if (linkExpiry) payload.expiresAt = new Date(linkExpiry).toISOString();

      const res = await API.post("/shares/public", payload);
      setPublicLink(res.data.publicUrl);
    } catch (err) {
      setLinkError(err.response?.data?.message || "Failed to generate link.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    } catch {
      console.error("Copy failed");
      toast.error("Failed to copy link");
    }
  };

  if (!resource) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${resource.name}"`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        <div className="flex gap-1 bg-bg-main p-1 rounded-xl border border-border">
          {[
            { key: "people", icon: Users, label: "People" },
            { key: "link", icon: Link, label: "Public Link" },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  py-2 rounded-lg text-sm font-bold transition-all duration-200
                  ${
                    activeTab === tab.key
                      ? "bg-surface text-text-primary shadow-sm border border-border"
                      : "text-text-secondary hover:text-text-primary"
                  }
                `}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "people" && (
            <motion.div
              key="people"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <form onSubmit={handleShareByEmail} className="space-y-3">
                <Input
                  label="Invite by email"
                  type="email"
                  placeholder="teammate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={shareError}
                  required
                />

                <div className="flex gap-2">
                  {["viewer", "editor"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`
                        flex-1 py-2 rounded-xl text-sm font-bold capitalize
                        border transition-all duration-150
                        ${
                          role === r
                            ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                            : "bg-bg-main text-text-secondary border-border hover:border-brand-blue"
                        }
                      `}
                    >
                      {r === "viewer" ? "👁 Viewer" : "✏️ Editor"}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSharing}
                  loadingText="Sharing..."
                >
                  Send Invite
                </Button>
              </form>

              <div className="h-px bg-border" />

              <div className="space-y-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  People with access
                </p>

                {loadingShares ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-brand-blue border-t-transparent rounded-full" />
                  </div>
                ) : currentShares.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-4">
                    No one else has access yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentShares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-3 bg-bg-main rounded-xl border border-border"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-text-primary truncate">
                            {share.grantee_email ||
                              share.grantee_name ||
                              "Unknown"}
                          </span>
                          <RoleBadge role={share.role} />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                          onClick={() => handleRevoke(share.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "link" && (
            <motion.div
              key="link"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <Input
                label="Password (optional)"
                type="password"
                placeholder="Leave blank for no password"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
              />

              <Input
                label="Expires at (optional)"
                type="datetime-local"
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(e.target.value)}
              />

              {linkError && (
                <p className="text-xs font-semibold text-red-500">
                  {linkError}
                </p>
              )}

              <Button
                variant="primary"
                className="w-full gap-2"
                onClick={handleGenerateLink}
                isLoading={isGenerating}
                loadingText="Generating..."
              >
                <Link size={15} />
                Generate Link
              </Button>

              {/* Generated Link Display */}
              <AnimatePresence>
                {publicLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 p-3 bg-bg-main border border-border rounded-xl"
                  >
                    <p className="text-xs text-text-secondary truncate flex-1 font-mono">
                      {publicLink}
                    </p>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopy}
                      className="shrink-0 gap-1"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-green-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[11px] text-text-secondary leading-relaxed">
                Anyone with this link can view the{" "}
                {resource.type === "folder" ? "folder" : "file"}.
                {linkPassword && " Password protected. "}
                {linkExpiry &&
                  ` Expires ${new Date(linkExpiry).toLocaleDateString()}.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default ShareModal;
