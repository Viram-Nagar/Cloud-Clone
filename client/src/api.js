import axios from "axios";

const API = axios.create({
  baseURL: "https://cloud-clone.vercel.app/api",
});

// This attaches your JWT token automatically to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
