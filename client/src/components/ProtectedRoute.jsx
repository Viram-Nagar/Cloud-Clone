import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show nothing (or a spinner) while we check if the user is logged in
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If no user is found, kick them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists, render the Dashboard
  return children;
};

export default ProtectedRoute;
