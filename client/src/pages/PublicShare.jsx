import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api.jsx";
import Button from "../components/ui/Button";
import FileIcon from "../components/ui/FileIcon";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { Download, Lock, Cloud, FileText, AlertCircle } from "lucide-react";

const PublicShare = () => {
  const { token } = useParams();

  const [status, setStatus] = useState("loading");
  const [resource, setResource] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [token]);

  const fetchResource = async (pwd = "") => {
    try {
      const params = pwd ? { password: pwd } : {};
      const res = await API.get(`/shares/public/${token}`, { params });
      setResource(res.data.data);
      setStatus("granted");

      const mime = res.data.data?.mimeType || "";
      if (
        res.data.data?.fileId &&
        (mime.startsWith("image/") || mime === "application/pdf")
      ) {
        setPreviewLoading(true);
        try {
          const dlRes = await API.get(`/shares/public/download/${token}`);
          setPreviewUrl(dlRes.data.downloadUrl);
        } catch {
          // silent fail
        } finally {
          setPreviewLoading(false);
        }
      }
    } catch (err) {
      const errStatus = err.response?.status;
      const data = err.response?.data;

      if (errStatus === 401 && data?.passwordRequired) {
        setStatus("password_required");
      } else if (errStatus === 401) {
        setPasswordError("Incorrect password. Try again.");
        setIsChecking(false);
      } else if (errStatus === 410) {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsChecking(true);
    setPasswordError("");
    await fetchResource(password);
    setIsChecking(false);
  };

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

  const mime = resource?.mimeType || "";
  const isImage = mime.startsWith("image/") && mime !== "image/svg+xml";
  const isPDF = mime === "application/pdf";
  const isDocx =
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  // --- Password / Error / Expired screens (centered card) ---
  if (
    status === "loading" ||
    status === "password_required" ||
    status === "expired" ||
    status === "error"
  ) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 font-inter">
        {/* Logo */}
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

          {/* PASSWORD */}
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
              <div className="p-4 bg-red-50 rounded-2xl">
                <AlertCircle size={32} className="text-red-400" />
              </div>
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
  }

  // --- GRANTED — Full screen view ---
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        {/* Left: Logo + file name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-brand-gradient p-1.5 rounded-lg text-white">
              <Cloud size={16} fill="currentColor" />
            </div>
            <span className="text-sm font-black text-white hidden sm:inline">
              CloudClone
            </span>
          </div>

          <div className="w-px h-5 bg-gray-700 shrink-0" />

          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm sm:text-base truncate">
              {resource?.name || "Shared File"}
            </h1>
            <p className="text-gray-400 text-xs">Shared with you</p>
          </div>
        </div>

        {/* Right: Download button */}
        {resource?.fileId && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-bold shrink-0 disabled:opacity-50"
          >
            <Download size={16} />
            <span className="hidden sm:inline">
              {isDownloading ? "Downloading..." : "Download"}
            </span>
          </button>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Preview loading */}
        {previewLoading && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-brand-blue border-t-transparent rounded-full" />
            <p className="text-gray-400 font-medium">Loading preview...</p>
          </div>
        )}

        {/* Image */}
        {!previewLoading && isImage && previewUrl && (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt={resource?.name}
              className="max-w-full max-h-[calc(100vh-80px)] object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}

        {/* PDF */}
        {!previewLoading && isPDF && previewUrl && (
          <div className="w-full h-[calc(100vh-80px)]">
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full rounded-xl"
              title={resource?.name}
            />
          </div>
        )}

        {/* DOCX */}
        {!previewLoading && isDocx && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="p-8 bg-blue-500/10 rounded-3xl border border-blue-500/20">
              <FileText size={80} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-2">
                {resource?.name}
              </p>
              <p className="text-gray-400 text-sm">
                Word documents cannot be previewed in the browser.
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

        {/* Fallback — other file types */}
        {!previewLoading &&
          !isImage &&
          !isPDF &&
          !isDocx &&
          resource?.fileId && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="p-8 bg-gray-800 rounded-3xl border border-gray-700">
                <FileIcon fileName={resource?.name || ""} size={80} />
              </div>
              <div>
                <p className="text-white font-bold text-xl mb-2">
                  {resource?.name}
                </p>
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

        {/* Folder */}
        {resource?.folderId && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="p-8 bg-gray-800 rounded-3xl border border-gray-700">
              <FileIcon fileName={resource?.name || ""} size={80} />
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-2">
                {resource?.name}
              </p>
              <p className="text-gray-400 text-sm">Folder sharing preview.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicShare;

// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import API from "../api.jsx";
// import Button from "../components/ui/Button";
// import FileIcon from "../components/ui/FileIcon";
// import Input from "../components/ui/Input";
// import Card from "../components/ui/Card";
// import { Download, Lock, Cloud, FileText } from "lucide-react";

// const PublicShare = () => {
//   const { token } = useParams();

//   const [status, setStatus] = useState("loading");
//   const [resource, setResource] = useState(null);
//   const [password, setPassword] = useState("");
//   const [passwordError, setPasswordError] = useState("");
//   const [isChecking, setIsChecking] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [previewLoading, setPreviewLoading] = useState(false);

//   useEffect(() => {
//     fetchResource();
//   }, [token]);

//   const fetchPreview = async () => {
//     setPreviewLoading(true);
//     try {
//       const res = await API.get(`/shares/public/download/${token}`);
//       setPreviewUrl(res.data.downloadUrl);
//     } catch {
//       // preview failed silently
//     } finally {
//       setPreviewLoading(false);
//     }
//   };

//   const fetchResource = async (pwd = "") => {
//     try {
//       const params = pwd ? { password: pwd } : {};
//       const res = await API.get(`/shares/public/${token}`, { params });
//       setResource(res.data.data);
//       setStatus("granted");

//       // Fetch preview for images and PDFs
//       const mime = res.data.data?.mimeType || "";
//       if (
//         res.data.data?.fileId &&
//         (mime.startsWith("image/") || mime === "application/pdf")
//       ) {
//         setPreviewLoading(true);
//         try {
//           const dlRes = await API.get(`/shares/public/download/${token}`);
//           setPreviewUrl(dlRes.data.downloadUrl);
//         } catch {
//           // silent fail
//         } finally {
//           setPreviewLoading(false);
//         }
//       }
//     } catch (err) {
//       const status = err.response?.status;
//       const data = err.response?.data;

//       if (status === 401 && data?.passwordRequired) {
//         setStatus("password_required");
//       } else if (status === 401) {
//         setPasswordError("Incorrect password. Try again.");
//         setIsChecking(false);
//       } else if (status === 410) {
//         setStatus("expired");
//       } else {
//         setStatus("error");
//       }
//     }
//   };

//   const handlePasswordSubmit = async (e) => {
//     e.preventDefault();
//     if (!password.trim()) return;
//     setIsChecking(true);
//     setPasswordError("");
//     await fetchResource(password);
//     setIsChecking(false);
//   };

//   const handleDownload = async () => {
//     setIsDownloading(true);
//     try {
//       const res = await API.get(`/shares/public/download/${token}`);
//       window.open(res.data.downloadUrl, "_blank");
//     } catch (err) {
//       console.error("Download failed:", err);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   // --- Render file preview based on mime type ---
//   const renderPreview = () => {
//     const mime = resource?.mimeType || "";
//     const isImage = mime.startsWith("image/") && mime !== "image/svg+xml";
//     const isPDF = mime === "application/pdf";
//     const isDocx =
//       mime ===
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

//     if (previewLoading) {
//       return (
//         <div className="flex items-center justify-center h-48 bg-bg-main rounded-2xl border border-border">
//           <div className="animate-spin h-8 w-8 border-4 border-brand-blue border-t-transparent rounded-full" />
//         </div>
//       );
//     }

//     if (isImage && previewUrl) {
//       return (
//         <div className="rounded-2xl overflow-hidden border border-border">
//           <img
//             src={previewUrl}
//             alt={resource.name}
//             className="w-full max-h-80 object-contain bg-bg-main"
//           />
//         </div>
//       );
//     }

//     if (isPDF && previewUrl) {
//       return (
//         <div className="rounded-2xl overflow-hidden border border-border h-80">
//           <iframe
//             src={`${previewUrl}#toolbar=1`}
//             className="w-full h-full"
//             title={resource.name}
//           />
//         </div>
//       );
//     }

//     if (isDocx) {
//       return (
//         <div className="flex justify-center">
//           <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col items-center gap-2">
//             <FileText size={56} className="text-blue-500" />
//             <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
//               Word Document
//             </span>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="flex justify-center">
//         <div className="p-8 bg-bg-main rounded-3xl border border-border">
//           <FileIcon fileName={resource?.name || ""} size={56} />
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 font-inter">
//       <div className="absolute top-6 left-6 flex items-center gap-2">
//         <div className="bg-brand-gradient p-2 rounded-xl text-white">
//           <Cloud size={20} fill="currentColor" />
//         </div>
//         <span className="text-lg font-black text-brand-gradient">
//           CloudClone
//         </span>
//       </div>

//       <Card className="w-full max-w-lg shadow-2xl">
//         {/* LOADING */}
//         {status === "loading" && (
//           <div className="flex flex-col items-center py-12 gap-4">
//             <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full" />
//             <p className="text-text-secondary font-medium">
//               Loading shared file...
//             </p>
//           </div>
//         )}

//         {/* PASSWORD REQUIRED */}
//         {status === "password_required" && (
//           <div className="space-y-6">
//             <div className="flex flex-col items-center gap-3 text-center">
//               <div className="p-4 bg-brand-blue/10 rounded-2xl">
//                 <Lock size={32} className="text-brand-blue" />
//               </div>
//               <h2 className="text-xl font-bold text-text-primary">
//                 Password Required
//               </h2>
//               <p className="text-sm text-text-secondary">
//                 This file is password protected.
//               </p>
//             </div>
//             <form onSubmit={handlePasswordSubmit} className="space-y-4">
//               <Input
//                 label="Enter Password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 error={passwordError}
//                 autoFocus
//                 required
//               />
//               <Button
//                 type="submit"
//                 variant="primary"
//                 className="w-full"
//                 isLoading={isChecking}
//                 loadingText="Checking..."
//               >
//                 Unlock
//               </Button>
//             </form>
//           </div>
//         )}

//         {/* GRANTED */}
//         {status === "granted" && resource && (
//           <div className="space-y-5">
//             {/* Header */}
//             <div className="text-center space-y-1">
//               <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
//                 Shared with you
//               </p>
//               <h2 className="text-lg font-bold text-text-primary truncate">
//                 {resource.name}
//               </h2>
//             </div>

//             {/* Preview */}
//             {resource.fileId && renderPreview()}

//             {/* Folder icon */}
//             {resource.folderId && (
//               <div className="flex justify-center">
//                 <div className="p-8 bg-bg-main rounded-3xl border border-border">
//                   <FileIcon fileName={resource.name} size={56} />
//                 </div>
//               </div>
//             )}

//             {/* Download Button */}
//             {resource.fileId && (
//               <Button
//                 variant="primary"
//                 className="w-full gap-2"
//                 onClick={handleDownload}
//                 isLoading={isDownloading}
//                 loadingText="Preparing download..."
//               >
//                 <Download size={16} />
//                 Download File
//               </Button>
//             )}

//             {resource.folderId && (
//               <p className="text-center text-sm text-text-secondary">
//                 Folder sharing — download coming soon.
//               </p>
//             )}
//           </div>
//         )}

//         {/* EXPIRED */}
//         {status === "expired" && (
//           <div className="flex flex-col items-center py-12 gap-4 text-center">
//             <div className="p-4 bg-red-50 rounded-2xl">
//               <Lock size={32} className="text-red-400" />
//             </div>
//             <h2 className="text-xl font-bold text-text-primary">
//               Link Expired
//             </h2>
//             <p className="text-sm text-text-secondary">
//               This sharing link has expired and is no longer valid.
//             </p>
//           </div>
//         )}

//         {/* ERROR */}
//         {status === "error" && (
//           <div className="flex flex-col items-center py-12 gap-4 text-center">
//             <h2 className="text-xl font-bold text-text-primary">
//               Link Not Found
//             </h2>
//             <p className="text-sm text-text-secondary">
//               This link is invalid or has been removed.
//             </p>
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default PublicShare;

// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import API from "../api.jsx";
// import Button from "../components/ui/Button";
// import FileIcon from "../components/ui/FileIcon";
// import Input from "../components/ui/Input";
// import Card from "../components/ui/Card";
// import { Download, Lock, Cloud } from "lucide-react";

// const PublicShare = () => {
//   const { token } = useParams();

//   const [status, setStatus] = useState("loading");

//   const [resource, setResource] = useState(null);
//   const [password, setPassword] = useState("");
//   const [passwordError, setPasswordError] = useState("");
//   const [isChecking, setIsChecking] = useState(false);
//   const [downloadUrl, setDownloadUrl] = useState("");
//   const [isDownloading, setIsDownloading] = useState(false);

//   useEffect(() => {
//     fetchResource();
//   }, [token]);

//   const fetchResource = async (pwd = "") => {
//     try {
//       const params = pwd ? { password: pwd } : {};
//       const res = await API.get(`/shares/public/${token}`, { params });
//       setResource(res.data.data);
//       setStatus("granted");
//     } catch (err) {
//       const status = err.response?.status;
//       const data = err.response?.data;

//       if (status === 401 && data?.passwordRequired) {
//         setStatus("password_required");
//       } else if (status === 401) {
//         setPasswordError("Incorrect password. Try again.");
//         setIsChecking(false);
//       } else if (status === 410) {
//         setStatus("expired");
//       } else {
//         setStatus("error");
//       }
//     }
//   };

//   const handlePasswordSubmit = async (e) => {
//     e.preventDefault();
//     if (!password.trim()) return;
//     setIsChecking(true);
//     setPasswordError("");
//     await fetchResource(password);
//     setIsChecking(false);
//   };

//   const handleDownload = async () => {
//     setIsDownloading(true);
//     try {
//       const res = await API.get(`/shares/public/download/${token}`);
//       window.open(res.data.downloadUrl, "_blank");
//     } catch (err) {
//       console.error("Download failed:", err);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 font-inter">
//       <div className="absolute top-6 left-6 flex items-center gap-2">
//         <div className="bg-brand-gradient p-2 rounded-xl text-white">
//           <Cloud size={20} fill="currentColor" />
//         </div>
//         <span className="text-lg font-black text-brand-gradient">
//           CloudClone
//         </span>
//       </div>

//       <Card className="w-full max-w-md shadow-2xl">
//         {status === "loading" && (
//           <div className="flex flex-col items-center py-12 gap-4">
//             <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full" />
//             <p className="text-text-secondary font-medium">
//               Loading shared file...
//             </p>
//           </div>
//         )}

//         {status === "password_required" && (
//           <div className="space-y-6">
//             <div className="flex flex-col items-center gap-3 text-center">
//               <div className="p-4 bg-brand-blue/10 rounded-2xl">
//                 <Lock size={32} className="text-brand-blue" />
//               </div>
//               <h2 className="text-xl font-bold text-text-primary">
//                 Password Required
//               </h2>
//               <p className="text-sm text-text-secondary">
//                 This file is password protected.
//               </p>
//             </div>

//             <form onSubmit={handlePasswordSubmit} className="space-y-4">
//               <Input
//                 label="Enter Password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 error={passwordError}
//                 autoFocus
//                 required
//               />
//               <Button
//                 type="submit"
//                 variant="primary"
//                 className="w-full"
//                 isLoading={isChecking}
//                 loadingText="Checking..."
//               >
//                 Unlock
//               </Button>
//             </form>
//           </div>
//         )}

//         {status === "granted" && resource && (
//           <div className="space-y-6">
//             <div className="text-center space-y-2">
//               <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
//                 Shared with you
//               </p>
//               <h2 className="text-xl font-bold text-text-primary truncate">
//                 {resource.name}
//               </h2>
//             </div>

//             <div className="flex justify-center">
//               <div className="p-6 bg-bg-main rounded-3xl border border-border">
//                 <FileIcon fileName={resource.name} size={48} />
//               </div>
//             </div>

//             {resource.fileId && (
//               <Button
//                 variant="primary"
//                 className="w-full gap-2"
//                 onClick={handleDownload}
//                 isLoading={isDownloading}
//                 loadingText="Preparing download..."
//               >
//                 <Download size={16} />
//                 Download File
//               </Button>
//             )}

//             {resource.folderId && (
//               <p className="text-center text-sm text-text-secondary">
//                 Folder sharing preview — download coming soon.
//               </p>
//             )}
//           </div>
//         )}

//         {status === "expired" && (
//           <div className="flex flex-col items-center py-12 gap-4 text-center">
//             <div className="p-4 bg-red-50 rounded-2xl">
//               <Lock size={32} className="text-red-400" />
//             </div>
//             <h2 className="text-xl font-bold text-text-primary">
//               Link Expired
//             </h2>
//             <p className="text-sm text-text-secondary">
//               This sharing link has expired and is no longer valid.
//             </p>
//           </div>
//         )}

//         {status === "error" && (
//           <div className="flex flex-col items-center py-12 gap-4 text-center">
//             <h2 className="text-xl font-bold text-text-primary">
//               Link Not Found
//             </h2>
//             <p className="text-sm text-text-secondary">
//               This link is invalid or has been removed.
//             </p>
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default PublicShare;
