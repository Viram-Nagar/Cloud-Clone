import React, { useState, useEffect } from "react";
import { X, Download, FileX } from "lucide-react";
import API from "../../api.jsx";
import Button from "./Button";
import FileIcon from "./FileIcon";

const FilePreviewModal = ({ file, isOpen, onClose }) => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !file) return;

    const fetchDownloadUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/files/${file.id}/download`);
        setDownloadUrl(res.data.downloadUrl);
      } catch (err) {
        setError("Could not load preview.");
      } finally {
        setLoading(false);
      }
    };

    fetchDownloadUrl();

    // Cleanup on close
    return () => {
      setDownloadUrl(null);
      setLoading(true);
      setError(null);
    };
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  // --- Detect file type ---
  const mime = file.mime_type || "";
  const isImage = mime.startsWith("image/");
  const isPDF = mime === "application/pdf";
  const isText = mime.startsWith("text/");

  // --- Render preview based on type ---
  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <FileX size={40} className="text-text-secondary" />
          <p className="text-text-secondary">{error}</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center bg-bg-main rounded-xl p-4">
          <img
            src={downloadUrl}
            alt={file.name}
            className="max-h-[60vh] max-w-full object-contain rounded-lg"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={downloadUrl}
          title={file.name}
          className="w-full h-[60vh] rounded-xl border border-border"
        />
      );
    }

    if (isText) {
      return <TextPreview url={downloadUrl} />;
    }

    // Fallback — no preview available
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <FileIcon fileName={file.name} size={48} />
        <p className="text-text-secondary text-sm">
          Preview not available for this file type.
        </p>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="primary" className="gap-2">
            <Download size={16} /> Download File
          </Button>
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text-primary/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-3xl bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <FileIcon fileName={file.name} size={20} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {file.name}
              </p>
              <p className="text-xs text-text-secondary">
                {file.size_bytes
                  ? (file.size_bytes / 1024).toFixed(1) + " KB"
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            {downloadUrl && (
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Download size={14} /> Download
                </Button>
              </a>
            )}
            {/* Close Button */}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-5">{renderPreview()}</div>
      </div>
    </div>
  );
};

// --- Text Preview Sub-component ---
const TextPreview = ({ url }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        setText(t);
        setLoading(false);
      })
      .catch(() => {
        setText("Could not load text content.");
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-6 w-6 border-4 border-brand-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <pre className="w-full max-h-[60vh] overflow-auto bg-bg-main rounded-xl p-4 text-sm text-text-primary font-mono whitespace-pre-wrap border border-border">
      {text}
    </pre>
  );
};

export default FilePreviewModal;
