import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import Dashboard from "./components/Dashboard";
import Pricing from "./components/Pricing";
import AuthCallback from "./components/Auth/AuthCallback";
import ScanResults from "./components/ScanResults";
import BlogGeneratorPage from "./pages/BlogGenerator";
import SourceAnalyzerPage from "./pages/SourceAnalyzer";
import AdminDashboard from "./pages/Admin";
import UserDetailsModal from "./components/Admin/UserDetailsModal";
import MyBlogPosts from "./pages/MyBlogPosts";
import BlogPostDetail from "./pages/BlogPostDetail";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/results" element={<ScanResults />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-blog-posts"
            element={
              <ProtectedRoute>
                <MyBlogPosts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/blog/:postId"
            element={
              <ProtectedRoute>
                <BlogPostDetail />
              </ProtectedRoute>
            }
          />

          {/* Paid Features */}
          <Route path="/blog-generator" element={<BlogGeneratorPage />} />
          <Route path="/source-analyzer" element={<SourceAnalyzerPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/user/:userId" element={<UserDetailsModal />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
