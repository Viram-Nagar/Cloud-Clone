import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Security & Pages
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* 1. Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 2. Protected Routes Wrapper */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Outlet content */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recent" element={<div>Recent Files Page</div>} />
          <Route path="/starred" element={<div>Starred Files Page</div>} />
          <Route path="/trash" element={<div>Trash Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
        </Route>

        {/* 3. The "Smart" Root Redirect */}
        {/* This will attempt to go to dashboard; ProtectedRoute will catch them if they aren't logged in */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 4. Catch-all: Redirect any unknown URL to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
