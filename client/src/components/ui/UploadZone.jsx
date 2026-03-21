import { toast } from "react-toastify";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api.jsx";
import FileIcon from "./FileIcon";
import ProgressBar from "./ProgressBar";
import Button from "./Button";

// --- Per-file status ---
// { id, file, progress, status: 'pending'|'uploading'|'done'|'error', error }

const UploadZone = ({ currentFolderId, onUploadComplete }) => {
  const [uploadQueue, setUploadQueue] = useState([]);

  // --- Helper: update one file in queue ---
  const updateFile = (id, updates) => {
    setUploadQueue((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  // --- Core Upload Logic ---
  const uploadFile = async (queueItem) => {
    const { id, file } = queueItem;

    try {
      // STEP 1: Init — get fileId + storageKey
      updateFile(id, { status: "uploading", progress: 0 });

      const initRes = await API.post("/files/init", {
        fileName: file.name,
        mimeType: file.type,
        folderId: currentFolderId || null,
      });

      const { fileId } = initRes.data;

      // STEP 2: Upload actual file with progress tracking
      const formData = new FormData();
      formData.append("file", file);

      await API.post(`/files/upload/${fileId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          updateFile(id, { progress: percent });
        },
      });

      // STEP 3: Done!
      updateFile(id, { status: "done", progress: 100 });
      toast.success(`${file.name} uploaded successfully`);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Upload failed";
      updateFile(id, { status: "error", error: errMsg });
      if (err.response?.status === 409) {
        toast.error(errMsg);
      } else if (
        err.response?.status === 403 &&
        err.response?.data?.storageExceeded
      ) {
        toast.warning("Storage limit reached! Delete files to free up space.");
      } else if (errMsg.includes("Invalid file type")) {
        toast.error("Invalid file type. Check allowed formats.");
      } else if (err.response?.status === 413 || errMsg.includes("too large")) {
        toast.error("File too large. Maximum size is 5MB.");
      } else {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  // --- Dropzone Config ---
  const onDrop = async (acceptedFiles) => {
    // 1. Add all files to queue
    const newItems = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending",
      error: null,
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);

    // 2. Upload all files
    await Promise.all(newItems.map((item) => uploadFile(item)));

    // 3. Refresh dashboard
    const allDone = newItems.every((item) => item.status !== "error");
    if (allDone) {
      onUploadComplete?.();
      window.dispatchEvent(new Event("storage-updated"));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // --- Remove from queue ---
  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((f) => f.id !== id));
  };

  // --- Clear completed ---
  const clearCompleted = () => {
    setUploadQueue((prev) => prev.filter((f) => f.status !== "done"));
  };

  return (
    <div className="space-y-4">
      {/* DROP ZONE AREA */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? "border-brand-blue bg-brand-blue/5 scale-[1.01]"
              : "border-border hover:border-brand-blue/50 hover:bg-bg-main"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`p-4 rounded-2xl transition-colors ${
              isDragActive ? "bg-brand-blue/10" : "bg-bg-main"
            }`}
          >
            <Upload
              size={32}
              className={
                isDragActive ? "text-brand-blue" : "text-text-secondary"
              }
            />
          </div>
          {isDragActive ? (
            <p className="text-brand-blue font-bold text-lg">
              Drop your files here!
            </p>
          ) : (
            <>
              <p className="text-text-primary font-bold text-base">
                Drag & drop files here
              </p>
              <p className="text-text-secondary text-sm">
                or{" "}
                <span className="text-brand-blue font-bold underline">
                  browse files
                </span>
              </p>
              <p className="text-text-secondary text-xs mt-1">Max size: 5MB</p>
            </>
          )}
        </div>
      </div>

      {/* UPLOAD QUEUE */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {uploadQueue.length} file(s)
              </span>
              {uploadQueue.some((f) => f.status === "done") && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear done
                </Button>
              )}
            </div>

            {/* File List */}
            {uploadQueue.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-3 bg-bg-main rounded-xl border border-border"
              >
                {/* File Icon */}
                <FileIcon fileName={item.file.name} size={20} />

                {/* File Info + Progress */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {item.file.name}
                  </p>

                  {/* Status */}
                  {item.status === "uploading" && (
                    <ProgressBar progress={item.progress} />
                  )}
                  {item.status === "done" && (
                    <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
                      <FileCheck size={12} /> Upload complete!
                    </p>
                  )}
                  {item.status === "error" && (
                    <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {item.error}
                    </p>
                  )}
                  {item.status === "pending" && (
                    <p className="text-xs text-text-secondary">Waiting...</p>
                  )}
                </div>

                {/* Remove Button */}
                {(item.status === "done" || item.status === "error") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromQueue(item.id)}
                  >
                    <X size={16} />
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;
