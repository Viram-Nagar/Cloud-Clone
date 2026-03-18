import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create the custom instance
const API = axios.create({
  baseURL: "https://cloud-clone.vercel.app/api",
  withCredentials: true,
});

// 1. Request Interceptor: Attach Access Token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token && token !== "undefined" && token !== "null") {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // ✅ Agar refresh chal raha hai toh queue mein daalo
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios({
          method: "post",
          url: "https://cloud-clone.vercel.app/api/auth/refresh",
          withCredentials: true,
        });

        const { accessToken } = res.data;
        localStorage.setItem("token", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken); // ✅ Queue resolve karo
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null); // ✅ Queue reject karo
        localStorage.removeItem("token");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // ✅ Reset karo
      }
    }

    return Promise.reject(error);
  },
);

export default API;

// 2. Response Interceptor: Handle 401 and Refresh Token
// API.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Check if error is 401 and we haven't retried yet
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const res = await axios({
//           method: "post",
//           url: "https://cloud-clone.vercel.app/api/auth/refresh",
//           withCredentials: true,
//         });

//         const { accessToken } = res.data;

//         // Update storage
//         localStorage.setItem("token", accessToken);

//         // Update the failed request header and retry
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;

//         // Use axios directly to retry
//         return axios(originalRequest);
//       } catch (refreshError) {
//         // --- THE FIX IS HERE ---
//         console.error("Refresh token expired or invalid.");

//         // We only clear the token.
//         // We DO NOT use window.location.href = "/login" here.
//         // The ProtectedRoute in React will see that the user is null
//         // and redirect them gracefully.
//         localStorage.removeItem("token");

//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   },
// );

// import axios from "axios";

// // Create the custom instance
// const API = axios.create({
//   baseURL: "https://cloud-clone.vercel.app/api",
//   withCredentials: true,
// });

// // 1. Request Interceptor: Attach Access Token
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token && token !== "undefined" && token !== "null") {
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// // 2. Response Interceptor: Handle 401 and Refresh Token
// API.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Check if error is 401 and we haven't retried this specific request yet
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         /* CRITICAL FIX:
//            1. Use 'axios' directly (not 'API') to avoid infinite interceptor loops.
//            2. URL must be /auth/refresh to match your Backend AuthRoute.js
//         */
//         const res = await axios({
//           method: "post",
//           url: "https://cloud-clone.vercel.app/api/auth/refresh",
//           withCredentials: true, // Sends the HttpOnly Refresh Cookie
//         });

//         const { accessToken } = res.data;

//         // Update storage
//         localStorage.setItem("token", accessToken);

//         // Update the failed request with the NEW token and retry
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;

//         // Use the default axios to retry the original request
//         return axios(originalRequest);
//       } catch (refreshError) {
//         // If the refresh call itself fails (403/500), the refresh token is dead
//         console.error("Refresh token expired. Logging out...");
//         localStorage.removeItem("token");
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   },
// );

// export default API;

// import axios from "axios";

// const API = axios.create({
//   baseURL: "https://cloud-clone.vercel.app/api",
//   withCredentials: true, // CRITICAL: This allows the browser to send the Refresh Cookie
// });

// // 1. Request Interceptor (Existing - attaches the Access Token)
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token && token !== "undefined" && token !== "null") {
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// // 2. Response Interceptor (NEW - Handles the 401 error and refreshes token)
// API.interceptors.response.use(
//   (response) => response, // If the request succeeds, just return the response
//   async (error) => {
//     const originalRequest = error.config;

//     // If error is 401 (Expired) and we haven't tried refreshing yet
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         // Call the missing refresh-token route
//         const res = await axios.post(
//           "https://cloud-clone.vercel.app/api/auth/refresh-token",
//           {},
//           { withCredentials: true }, // Must include this to send the refresh cookie
//         );

//         const { accessToken } = res.data;

//         // Update localStorage with the fresh token
//         localStorage.setItem("token", accessToken);

//         // Update the header of the original request and retry it
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//         return API(originalRequest);
//       } catch (refreshError) {
//         // If refresh fails, the refresh token is also expired/invalid -> Log them out
//         localStorage.removeItem("token");
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   },
// );

// export default API;

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
