import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ProtectedRoute.jsx — simplified, loading is handled in App.jsx now
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // No need for loading here anymore
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !token || token === "undefined") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   const location = useLocation();
//   const token = localStorage.getItem("token");

//   // 1. While AuthContext is fetching /auth/me, show nothing or a spinner
//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-white">
//         <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
//       </div>
//     );
//   }

//   // 2. Only redirect if loading is DONE and we have NO user
//   if (!user || !token || token === "undefined") {
//     // Save the location they were trying to access
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return children;
// };

// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   const location = useLocation(); // Keep track of where the user was trying to go
//   const token = localStorage.getItem("token");
//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-white">
//         <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
//       </div>
//     );
//   }
//   // If there is NO token at all, they definitely need to login
//   if (!token || token === "undefined" || token === "null") {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }
//   // If loading is finished and we still have no user, something went wrong with the profile fetch
//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }
//   return children;
// };
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   const token = localStorage.getItem("token");

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-white">
//         <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
//       </div>
//     );
//   }

//   // Guard: Double-check logic.
//   // If we have a user in state but no token, or vice versa, redirect to login.
//   if (!user || !token || token === "undefined") {
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;
