import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Signup from "./Pages/Signup";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import DashboardAI from "./Pages/DashboardAI"; // ✅ AI Dashboard Page

// -----------------------------
// Protected Route Wrapper
// -----------------------------
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// -----------------------------
// App Component
// -----------------------------
const App = () => {
  return (
    <Routes>
      {/* Default route → Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Dashboard route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ✅ AI Tools Dashboard route */}
      <Route
        path="/dashai"
        element={
          <ProtectedRoute>
            <DashboardAI />
          </ProtectedRoute>
        }
      />

      {/* Auth routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Catch-all → Redirect to Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
