import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainAppContent from './components/MainAppContent';
import Login from './components/Login';
import Signup from './components/Signup';
import SellerDashboard from './components/SellerDashboard';
import SearchResults from './components/SearchResults';
import './App.css';

// Router root wrapper
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <p className="animate-pulse tracking-widest text-pink-400 font-bold uppercase">Restoring Session...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
      <Route 
        path="/seller/dashboard" 
        element={user?.role === 'SELLER' ? <SellerDashboard /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/search" 
        element={user ? <SearchResults /> : <Navigate to="/login" replace />} 
      />
      <Route
        path="/"
        element={
          user 
            ? (user.role === 'SELLER' ? <Navigate to="/seller/dashboard" replace /> : <MainAppContent />) 
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
