import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem("token");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Guard: Double-check logic.
  // If we have a user in state but no token, or vice versa, redirect to login.
  if (!user || !token || token === "undefined") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
