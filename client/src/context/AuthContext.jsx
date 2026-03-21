import { toast } from "react-toastify";
import { createContext, useState, useEffect, useContext } from "react";
import API from "../api.jsx";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");

      if (!token || token === "undefined" || token === "null") {
        setLoading(false);
        return;
      }

      try {
        const res = await API.get("/auth/me");

        if (res.data) {
          setUser(res?.data);
        }
      } catch (err) {
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

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });

    const token = res.data?.accessToken;
    const userData = res.data?.user;

    if (token && userData) {
      localStorage.setItem("token", token);
      setUser(userData);
      return res.data;
    } else {
      throw new Error("Invalid response from server");
    }
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err.message);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      toast.success("Logged out successfully");
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
