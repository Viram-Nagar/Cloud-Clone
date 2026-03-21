import API from "../api";

const downloadFile = async (file) => {
  try {
    const res = await API.get(`/files/${file.id}/download?download=true`);
    const url = res.data.downloadUrl;

    const response = await fetch(url);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
  }
};

export default downloadFile;
