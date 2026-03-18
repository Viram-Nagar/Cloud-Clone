import axios from "axios";

const API = axios.create({
  baseURL: "https://cloud-clone.vercel.app/api",
  withCredentials: true, // CRITICAL: This allows the browser to send the Refresh Cookie
});

// 1. Request Interceptor (Existing - attaches the Access Token)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token && token !== "undefined" && token !== "null") {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// 2. Response Interceptor (NEW - Handles the 401 error and refreshes token)
API.interceptors.response.use(
  (response) => response, // If the request succeeds, just return the response
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Expired) and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call the missing refresh-token route
        const res = await axios.post(
          "https://cloud-clone.vercel.app/api/auth/refresh-token",
          {},
          { withCredentials: true }, // Must include this to send the refresh cookie
        );

        const { accessToken } = res.data;

        // Update localStorage with the fresh token
        localStorage.setItem("token", accessToken);

        // Update the header of the original request and retry it
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // If refresh fails, the refresh token is also expired/invalid -> Log them out
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default API;

// import axios from "axios";

// const API = axios.create({
//   baseURL: "https://cloud-clone.vercel.app/api",
// });

// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");

//   // Guard: Ensure token is a valid string before attaching it
//   if (token && token !== "undefined" && token !== "null") {
//     req.headers.Authorization = `Bearer ${token}`;
//   }

//   return req;
// });

// export default API;
