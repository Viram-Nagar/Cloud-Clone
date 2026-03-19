// Create this helper function once — reuse everywhere
import API from "../api";

const downloadFile = async (file) => {
  try {
    const res = await API.get(`/files/${file.id}/download`);
    const url = res.data.downloadUrl;

    // Fetch the file as a blob (bypasses cross-origin restriction)
    const response = await fetch(url);
    const blob = await response.blob();

    // Create object URL from blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
  }
};

export default downloadFile;
