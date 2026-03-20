import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  FileCode,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";

const FileIcon = ({ fileName, size = 24, className = "" }) => {
  const extension = fileName?.split(".").pop().toLowerCase();

  const map = {
    // Documents
    pdf: { icon: FileText, color: "text-red-500", bg: "bg-red-50" },
    doc: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
    docx: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
    txt: { icon: FileText, color: "text-slate-500", bg: "bg-slate-50" },
    csv: { icon: FileSpreadsheet, color: "text-green-600", bg: "bg-green-50" },
    xls: { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-50" },
    xlsx: { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-50" },
    ppt: { icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
    pptx: { icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
    // Images
    jpg: { icon: ImageIcon, color: "text-cyan-500", bg: "bg-cyan-50" },
    jpeg: { icon: ImageIcon, color: "text-cyan-500", bg: "bg-cyan-50" },
    png: { icon: ImageIcon, color: "text-cyan-500", bg: "bg-cyan-50" },
    gif: { icon: ImageIcon, color: "text-pink-500", bg: "bg-pink-50" },
    webp: { icon: ImageIcon, color: "text-cyan-500", bg: "bg-cyan-50" },
    svg: { icon: ImageIcon, color: "text-orange-500", bg: "bg-orange-50" },
    // Video
    mp4: { icon: Video, color: "text-violet-500", bg: "bg-violet-50" },
    webm: { icon: Video, color: "text-violet-500", bg: "bg-violet-50" },
    mov: { icon: Video, color: "text-violet-500", bg: "bg-violet-50" },
    // Audio
    mp3: { icon: Music, color: "text-emerald-500", bg: "bg-emerald-50" },
    wav: { icon: Music, color: "text-emerald-500", bg: "bg-emerald-50" },
    // Code/Archives
    zip: { icon: Archive, color: "text-amber-500", bg: "bg-amber-50" },
    js: { icon: FileCode, color: "text-yellow-500", bg: "bg-yellow-50" },
  };

  const {
    icon: Icon,
    color,
    bg,
  } = map[extension] || {
    icon: File,
    color: "text-slate-400",
    bg: "bg-slate-50",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-xl p-2.5 ${bg} ${className}`}
    >
      <Icon size={size} className={color} />
    </div>
  );
};

export default FileIcon;

// import React from "react";
// import {
//   FileText,
//   Image as ImageIcon,
//   Video,
//   Music,
//   Archive,
//   File,
//   FileCode,
// } from "lucide-react";

// const FileIcon = ({ fileName, size = 24, className = "" }) => {
//   // 1. Extract the extension from the filename
//   const extension = fileName?.split(".").pop().toLowerCase();

//   // 2. Define the Mapping Logic (Colors & Icons)
//   const map = {
//     // Documents
//     pdf: { icon: FileText, color: "text-red-500", bg: "bg-red-50" },
//     doc: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
//     docx: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
//     txt: { icon: FileText, color: "text-slate-500", bg: "bg-slate-50" },
//     // Images
//     jpg: { icon: ImageIcon, color: "text-cyan-500", bg: "bg-cyan-50" },
//     jpeg: { icon: ImageIcon, color: "text-cyan-500", bg: "bg-cyan-50" },
//     png: { icon: ImageIcon, color: "text-cyan-500", bg: "bg-cyan-50" },
//     svg: { icon: ImageIcon, color: "text-orange-500", bg: "bg-orange-50" },
//     // Video/Audio
//     mp4: { icon: Video, color: "text-violet-500", bg: "bg-violet-50" },
//     mov: { icon: Video, color: "text-violet-500", bg: "bg-violet-50" },
//     mp3: { icon: Music, color: "text-emerald-500", bg: "bg-emerald-50" },
//     // Code/Archives
//     zip: { icon: Archive, color: "text-amber-500", bg: "bg-amber-50" },
//     js: { icon: FileCode, color: "text-yellow-500", bg: "bg-yellow-50" },
//   };

//   // 3. Get the specific style or use a default
//   const {
//     icon: Icon,
//     color,
//     bg,
//   } = map[extension] || {
//     icon: File,
//     color: "text-slate-400",
//     bg: "bg-slate-50",
//   };

//   return (
//     <div
//       className={`flex items-center justify-center rounded-xl p-2.5 ${bg} ${className}`}
//     >
//       <Icon size={size} className={color} />
//     </div>
//   );
// };

// export default FileIcon;
