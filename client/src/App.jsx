import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Recent from "./pages/Recent";
import Starred from "./pages/Starred";
import Trash from "./pages/Trash";
import Search from "./pages/Search";
import SharedWithMe from "./pages/SharedWithMe";
import PublicShare from "./pages/PublicShare";
import MainLayout from "./layouts/MainLayout";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import FilePreviewPage from "./pages/FilePreviewPage";

const App = () => {
  const { loading, user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="/signup" element={<Signup />} />

        {/* PUBLIC SHARE — no login needed */}
        <Route path="/share/:token" element={<PublicShare />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shared" element={<SharedWithMe />} />
          <Route path="/search" element={<Search />} />
          <Route path="/recent" element={<Recent />} />
          <Route path="/starred" element={<Starred />} />
          <Route path="/trash" element={<Trash />} />
        </Route>

        {/* FILE PREVIEW — full page, inside ProtectedRoute but outside MainLayout */}
        <Route
          path="/preview/:fileId"
          element={
            <ProtectedRoute>
              <FilePreviewPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

// // ✅ FIXED App.jsx
// import React from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import Recent from "./pages/Recent";
// import Starred from "./pages/Starred";
// import Trash from "./pages/Trash";
// import Search from "./pages/Search";
// import SharedWithMe from "./pages/SharedWithMe";
// import PublicShare from "./pages/PublicShare";
// import MainLayout from "./layouts/MainLayout";
// import { useAuth } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Dashboard from "./pages/Dashboard";

// const App = () => {
//   const { loading, user } = useAuth();

//   // ✅ Show spinner INSIDE the Router, not before it
//   // Move the loading guard INSIDE Router so routes are always mounted
//   return (
//     <Router>
//       <Routes>
//         <Route
//           path="/login"
//           element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
//         />
//         <Route path="/signup" element={<Signup />} />

//         {/* PUBLIC SHARE — no login needed */}
//         <Route path="/share/:token" element={<PublicShare />} />

//         <Route
//           element={
//             <ProtectedRoute>
//               <MainLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/shared" element={<SharedWithMe />} />
//           <Route path="/search" element={<Search />} />
//           <Route path="/recent" element={<Recent />} />
//           <Route path="/starred" element={<Starred />} />
//           <Route path="/trash" element={<Trash />} />
//         </Route>
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

// import React from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// // Layouts
// import MainLayout from "./layouts/MainLayout";
// import { useAuth } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Dashboard from "./pages/Dashboard";

// const App = () => {
//   const { loading, user } = useAuth(); // Add 'user' here

//   if (loading) {
//     return (
//       <div className="h-screen w-full flex items-center justify-center bg-bg-main">
//         <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full" />
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <Routes>
//         {/* Prevent logged-in users from visiting Login/Signup */}
//         <Route
//           path="/login"
//           element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
//         />
//         <Route
//           path="/signup"
//           element={!user ? <Signup /> : <Navigate to="/dashboard" replace />}
//         />

//         <Route
//           element={
//             <ProtectedRoute>
//               <MainLayout />
//             </ProtectedRoute>
//           }
//         >
//           <Route path="/dashboard" element={<Dashboard />} />
//           {/* ... other routes */}
//         </Route>

//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

// const App = () => {
//   const { loading } = useAuth(); // Import useAuth at the top

//   // prevent "flicker" redirecting during the auth check
//   if (loading) {
//     return (
//       <div className="h-screen w-full flex items-center justify-center">
//         <div className="animate-spin h-10 w-10 border-4 border-brand-blue border-t-transparent rounded-full" />
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <Routes>
//         {/* 1. Public Routes */}
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />

//         {/* 2. Protected Routes Wrapper */}
//         <Route
//           element={
//             <ProtectedRoute>
//               <MainLayout />
//             </ProtectedRoute>
//           }
//         >
//           {/* Outlet content */}
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/recent" element={<div>Recent Files Page</div>} />
//           <Route path="/starred" element={<div>Starred Files Page</div>} />
//           <Route path="/trash" element={<div>Trash Page</div>} />
//           <Route path="/settings" element={<div>Settings Page</div>} />
//         </Route>

//         {/* 3. The "Smart" Root Redirect */}
//         {/* This will attempt to go to dashboard; ProtectedRoute will catch them if they aren't logged in */}
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />

//         {/* 4. Catch-all: Redirect any unknown URL to dashboard */}
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </Router>
//   );
// };
