import { createContext, useState, useEffect, useContext } from "react";
import API from "../api.jsx";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. PERSISTENT AUTH CHECK
  // This runs when the app first loads or refreshes
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");

      // Guard: If no token, we aren't logged in locally
      if (!token || token === "undefined" || token === "null") {
        setLoading(false);
        return;
      }

      try {
        // We call /auth/me to get user details.
        // NOTE: If the token is expired, the interceptor in api.js
        // will automatically try to refresh it before this call finishes.
        const res = await API.get("/auth/me");

        if (res.data) {
          setUser(res?.data);
        }
      } catch (err) {
        // If /auth/me fails AND the interceptor couldn't refresh the token,
        // it means the session is truly dead.
        console.error("Auth verification failed or session expired.");
        console.error(err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  // 2. LOGIN LOGIC
  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });

    const token = res.data?.accessToken;
    const userData = res.data?.user;

    if (token && userData) {
      // Store the short-lived access token locally
      localStorage.setItem("token", token);
      setUser(userData);
      return res.data;
    } else {
      throw new Error("Invalid response from server");
    }
  };

  // 3. CLEAN LOGOUT LOGIC (Coordination Fix)
  const logout = async () => {
    try {
      // PRO-TIP: We call the backend logout to clear the httpOnly Refresh Cookie.
      // Even if this fails, we still clear the local state in the 'finally' block.
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err.message);
    } finally {
      // Always wipe the local session
      localStorage.removeItem("token");
      setUser(null);

      // Optional: Redirect to login or refresh the page to clear any sensitive state
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// import { createContext, useState, useEffect, useContext } from "react";
// import API from "../api";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkUser = async () => {
//       const token = localStorage.getItem("token");

//       // Guard: If no token, don't even bother calling the API
//       if (!token || token === "undefined") {
//         setLoading(false);
//         return;
//       }

//       try {
//         const res = await API.get("/auth/me");
//         // Guard: Check if the response actually contains a user object
//         if (res.data && res.data.user) {
//           setUser(res.data.user);
//         } else {
//           throw new Error("User data missing in response");
//         }
//       } catch (err) {
//         console.error("Auth check failed:", err.message);
//         localStorage.removeItem("token");
//         setUser(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     checkUser();
//   }, []);

//   const login = async (email, password) => {
//     const res = await API.post("/auth/login", { email, password });

//     // Guard: Your backend sends 'accessToken'. Check if it and 'user' exist.
//     const token = res.data?.accessToken;
//     const userData = res.data?.user;

//     if (token && userData && userData.id) {
//       localStorage.setItem("token", token);
//       setUser(userData);
//       return res.data;
//     } else {
//       // If backend logic changes and keys go missing, we catch it here
//       throw new Error(
//         "Invalid response from server: Missing token or user info",
//       );
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
//export const useAuth = () => useContext(AuthContext);
