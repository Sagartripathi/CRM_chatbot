import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CampaignManagement from "./components/CampaignManagement";
import LeadManagement from "./components/LeadManagement";
import CallInterface from "./components/CallInterface";
import MeetingManagement from "./components/MeetingManagement";
import SupportTickets from "./components/SupportTickets";
import CampaignDetail from "./components/CampaignDetail";

// Context
import { AuthProvider, useAuth, apiClient } from "./contexts/AuthContext";

// Services
import { startKeepAlive, stopKeepAlive } from "./services/keepAliveService";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

// If REACT_APP_BACKEND_URL is not set, use CRA proxy by targeting "/api"
const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

// Configure apiClient base URL
apiClient.defaults.baseURL = API;

// Add global response interceptor for authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only handle 401 (Unauthorized) - this means token is invalid/expired
      const isAuthEndpoint = error.config?.url?.includes("/auth/");

      if (!isAuthEndpoint) {
        // Clear token and redirect to login
        localStorage.removeItem("token");

        //

        // Only redirect if not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    // Don't handle 403 (Forbidden) globally - let components handle their own errors
    return Promise.reject(error);
  }
);

// Private Route Component
interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps): React.ReactElement {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

// Main App Routes
function AppRoutes(): React.ReactElement {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <PrivateRoute>
            <CampaignManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <PrivateRoute>
            <LeadManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/campaigns/:campaignId"
        element={
          <PrivateRoute>
            <CampaignDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/campaigns/:campaignId/call"
        element={
          <PrivateRoute>
            <CallInterface />
          </PrivateRoute>
        }
      />
      <Route
        path="/meetings"
        element={
          <PrivateRoute>
            <MeetingManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <PrivateRoute>
            <SupportTickets />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App(): React.ReactElement {
  // Start keep-alive service to prevent Render free tier from spinning down
  useEffect(() => {
    startKeepAlive();

    // Cleanup on unmount
    return () => {
      stopKeepAlive();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
