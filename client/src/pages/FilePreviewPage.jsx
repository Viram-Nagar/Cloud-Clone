import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  File,
  Loader,
  AlertCircle,
} from "lucide-react";
import API from "../api.jsx";
import downloadFile from "../util/DownloadFile.jsx";
import FileIcon from "../components/ui/FileIcon";

const FilePreviewPage = () => {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const folderId = searchParams.get("folderId");
  const folderName = searchParams.get("folderName") || "My Drive";
  const pathParam = searchParams.get("path") || "";

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Fetch file info + signed URL ---
  // useEffect(() => {
  //   const fetchFile = async () => {
  //     setLoading(true);
  //     setError("");
  //     try {
  //       // Get signed URL
  //       const res = await API.get(`/files/${fileId}/download`);
  //       setPreviewUrl(res.data.downloadUrl);

  //       // Get file metadata — from the download response or separately
  //       // We store basic info in the URL as query params
  //       setFile({
  //         id: fileId,
  //         name: searchParams.get("fileName") || "File",
  //         mime_type: searchParams.get("mimeType") || "",
  //         size_bytes: searchParams.get("sizeBytes") || 0,
  //       });
  //     } catch (err) {
  //       console.error("Preview fetch failed:", err);
  //       setError("Failed to load file. Please try again.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchFile();
  // }, [fileId]);

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get(`/files/${fileId}/download`);
        setPreviewUrl(res.data.downloadUrl);
        setFile({
          id: fileId,
          name: searchParams.get("fileName") || "File",
          mime_type: searchParams.get("mimeType") || "",
          size_bytes: searchParams.get("sizeBytes") || 0,
        });

        // Track file open — fire and forget
        API.post(`/files/${fileId}/open`).catch(() => {});
      } catch (err) {
        console.error("Preview fetch failed:", err);
        setError("Failed to load file. Please try again.");
        toast.error("Failed to load file");
      } finally {
        setLoading(false);
      }
    };
    fetchFile();
  }, [fileId]);

  // --- Back navigation ---
  const handleBack = () => {
    if (folderId && folderId !== "") {
      navigate(
        `/dashboard?folderId=${folderId}&folderName=${encodeURIComponent(folderName)}&path=${encodeURIComponent(pathParam)}`,
      );
    } else {
      navigate("/dashboard");
    }
  };

  // --- Download handler ---
  const handleDownload = async () => {
    if (!file) return;
    try {
      await downloadFile(file);
      toast.success("Download started");
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const mime = file?.mime_type || "";
  const isImage = mime.startsWith("image/");
  const isPDF = mime === "application/pdf";
  const isDocx =
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        {/* Left: Back button + file name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold hidden sm:inline">
              {folderName}
            </span>
          </button>

          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm sm:text-base truncate">
              {file?.name || "Loading..."}
            </h1>
            {file?.size_bytes > 0 && (
              <p className="text-gray-400 text-xs">
                {(file.size_bytes / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        </div>

        {/* Right: Download button */}
        <button
          onClick={handleDownload}
          disabled={!file || loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-bold shrink-0 disabled:opacity-50"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-brand-blue border-t-transparent rounded-full" />
            <p className="text-gray-400 font-medium">Loading file...</p>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-red-500/10 rounded-2xl">
              <AlertCircle size={48} className="text-red-400" />
            </div>
            <p className="text-white font-bold text-lg">Failed to load file</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={handleBack}
              className="px-6 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          </div>
        )}

        {/* IMAGE PREVIEW */}
        {!loading && !error && isImage && previewUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt={file?.name}
              className="max-w-full max-h-[calc(100vh-80px)] object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}

        {/* PDF PREVIEW */}
        {!loading && !error && isPDF && previewUrl && (
          <div className="w-full h-[calc(100vh-80px)]">
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full rounded-xl"
              title={file?.name}
            />
          </div>
        )}

        {/* DOCX — no preview available */}
        {!loading && !error && isDocx && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="p-8 bg-blue-500/10 rounded-3xl border border-blue-500/20">
              <FileText size={80} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-2">{file?.name}</p>
              <p className="text-gray-400 text-sm">
                Word documents cannot be previewed in the browser.
              </p>
              <p className="text-gray-400 text-sm">
                Download the file to open it.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              <Download size={18} />
              Download to Open
            </button>
          </div>
        )}

        {/* FALLBACK — unknown file type */}
        {!loading && !error && !isImage && !isPDF && !isDocx && previewUrl && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="p-8 bg-gray-800 rounded-3xl border border-gray-700">
              <FileIcon fileName={file?.name || ""} size={80} />
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-2">{file?.name}</p>
              <p className="text-gray-400 text-sm">
                This file type cannot be previewed.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              <Download size={18} />
              Download to Open
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewPage;
