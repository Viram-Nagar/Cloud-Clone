import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const App = () => {
  const { loading, user } = useAuth();

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        toastClassName="!rounded-2xl !shadow-2xl !font-semibold !text-sm !min-w-[280px]"
        bodyClassName="!font-semibold !text-sm !py-1"
        closeButton={false}
        icon={({ type }) => {
          if (type === "success")
            return <CheckCircle size={20} strokeWidth={2} />;
          if (type === "error") return <XCircle size={20} strokeWidth={2} />;
          if (type === "warning")
            return <AlertTriangle size={20} strokeWidth={2} />;
          if (type === "info") return <Info size={20} strokeWidth={2} />;
          return null;
        }}
      />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/signup" element={<Signup />} />

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
    </>
  );
};

export default App;
