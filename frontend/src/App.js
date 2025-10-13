import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
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
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// If REACT_APP_BACKEND_URL is not set, use CRA proxy by targeting "/api"
const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

// Configure axios defaults
axios.defaults.baseURL = API;

// Private Route Component
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

// Main App Routes
function AppRoutes() {
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

function App() {
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
