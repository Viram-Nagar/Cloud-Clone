import useViewPreference from "../hooks/useViewPreference";
import ViewToggle from "../components/ui/ViewToggle";
import SortDropdown from "../components/ui/SortDropdown";
import TypeFilter from "../components/ui/TypeFilter";
import FileListView from "../components/ui/FileListView";
import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import downloadFile from "../util/DownloadFile.jsx";
import { useSearchParams } from "react-router-dom";
import { Search, FileX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api.jsx";
import FileCard from "../components/ui/FileCard";

import ShareModal from "../components/ui/ShareModal";
import VersionModal from "../components/ui/VersionModal";

const SearchPage = () => {
  const { viewMode, toggleView } = useViewPreference("search-view");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [typeFilter, setTypeFilter] = useState("");

  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [shareTarget, setShareTarget] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionTarget, setVersionTarget] = useState(null);
  // --- 1. Fetch results when URL query changes ---
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    fetchResults(query);
  }, [query]);

  const fetchResults = async (q) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/files/search", {
        params: { query: q },
      });
      setResults(res.data.files || []);
    } catch (err) {
      setError("Search failed. Please try again.");
      console.error("Search error:", err);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Handle search form submit ---
  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   if (!localQuery.trim()) return;
  //   navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
  // };

  // --- 3. File actions ---
  const handleFileAction = async (file, action) => {
    if (action === "download") {
      await downloadFile(file);
    }

    if (action === "delete") {
      try {
        await API.delete(`/files/${file.id}`);
        // Remove from results locally
        setResults((prev) => prev.filter((f) => f.id !== file.id));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    if (action === "share") {
      setShareTarget({ id: file.id, name: file.name, type: "file" });
      setIsShareModalOpen(true);
    }

    if (action === "rename") {
      // Refresh results after rename
      fetchResults(query);
    }

    // Add to handleFileAction in SearchPage.jsx and Starred.jsx
    if (action === "versions") {
      setVersionTarget(file);
      setIsVersionModalOpen(true);
    }
  };

  const getFilteredAndSorted = (items) => {
    let filtered = [...items];

    if (typeFilter) {
      filtered = filtered.filter((f) => {
        const mime = f.mime_type || "";
        if (typeFilter === "image") return mime.startsWith("image/");
        if (typeFilter === "pdf") return mime === "application/pdf";
        if (typeFilter === "word") return mime.includes("wordprocessingml");
        if (typeFilter === "excel")
          return mime.includes("spreadsheetml") || mime.includes("ms-excel");
        if (typeFilter === "ppt")
          return (
            mime.includes("presentationml") || mime.includes("ms-powerpoint")
          );
        if (typeFilter === "video") return mime.startsWith("video/");
        if (typeFilter === "audio") return mime.startsWith("audio/");
        if (typeFilter === "text")
          return mime === "text/plain" || mime === "text/csv";
        return true;
      });
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      if (sortBy === "size")
        comparison = (a.size_bytes || 0) - (b.size_bytes || 0);
      if (sortBy === "date")
        comparison = new Date(a.updated_at) - new Date(b.updated_at);
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredResults = getFilteredAndSorted(results);

  return (
    <div className="space-y-6">
      {/* A. SEARCH BAR */}
      {/* <div className="bg-surface border border-border rounded-3xl p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search your files..."
              autoFocus
              className="
                w-full pl-11 pr-4 py-2.5 rounded-xl border border-border
                bg-bg-main text-text-primary placeholder:text-text-secondary/50
                hover:border-brand-blue/40
                focus:bg-surface focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5
                outline-none transition-all duration-200 text-sm
              "
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-gradient text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0"
          >
            Search
          </button>
        </form>
      </div> */}

      {/* B. RESULTS HEADER */}
      {/* {query && !loading && (
        <div className="px-1">
          <p className="text-sm text-text-secondary">
            {results.length > 0 ? (
              <>
                Found{" "}
                <span className="font-bold text-text-primary">
                  {results.length}
                </span>{" "}
                result{results.length !== 1 ? "s" : ""} for{" "}
                <span className="font-bold text-brand-blue">"{query}"</span>
              </>
            ) : (
              <>
                No results for{" "}
                <span className="font-bold text-brand-blue">"{query}"</span>
              </>
            )}
          </p>
        </div>
      )} */}

      {/* CONTROLS */}
      {query && !loading && results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <TypeFilter value={typeFilter} onChange={setTypeFilter} />
          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChange={(key, order) => {
              setSortBy(key);
              setSortOrder(order);
            }}
          />
          <div className="ml-auto">
            <ViewToggle viewMode={viewMode} onToggle={toggleView} />
          </div>
        </div>
      )}

      {/* C. LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full mb-4" />
          <p className="text-text-secondary font-medium">Searching...</p>
        </div>
      )}

      {/* D. ERROR */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* E. EMPTY STATE */}
      {!loading && !error && query && results.length === 0 && (
        <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-bg-main rounded-2xl border border-border">
              <FileX size={32} className="text-text-secondary" />
            </div>
            <p className="text-text-primary font-bold">No files found</p>
            <p className="text-sm text-text-secondary">
              Try searching with a different keyword.
            </p>
          </div>
        </div>
      )}

      {/* F. NO QUERY STATE */}
      {!query && !loading && (
        <div className="text-center py-24 bg-bg-main/40 rounded-3xl border-2 border-dashed border-border/60">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-bg-main rounded-2xl border border-border">
              <Search size={32} className="text-text-secondary" />
            </div>
            <p className="text-text-primary font-bold">Search your files</p>
            <p className="text-sm text-text-secondary">
              Type something in the search bar above.
            </p>
          </div>
        </div>
      )}

      {/* G. RESULTS GRID */}
      {/* {!loading && results.length > 0 && (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {results.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onAction={handleFileAction}
                currentFolderId={file.folder_id ?? null}
                folderName="Search"
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )} */}
      {/* G. RESULTS */}
      {!loading &&
        filteredResults.length > 0 &&
        (viewMode === "list" ? (
          <FileListView
            files={filteredResults}
            folders={[]}
            onFileAction={handleFileAction}
            currentFolderId={null}
            folderName="Search"
            fullPath={[]}
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredResults.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onAction={handleFileAction}
                  currentFolderId={file.folder_id ?? null}
                  folderName="Search"
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ))}
      {/* H. FILE PREVIEW MODAL */}

      {/* I. SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTarget(null);
        }}
        resource={shareTarget}
      />
      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => {
          setIsVersionModalOpen(false);
          setVersionTarget(null);
        }}
        file={versionTarget}
      />
    </div>
  );
};

export default SearchPage;
