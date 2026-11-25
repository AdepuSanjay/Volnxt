import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import RiderDashboard from './pages/RiderDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChargingSession from './pages/ChargingSession';

import RegisterRider from './pages/RegisterRider';
import RegisterProvider from './pages/RegisterProvider';
import HowToUse from './pages/HowToUse';

const dashboardPath = (role) => role === 'ADMIN' ? '/admin/dashboard' : role === 'PROVIDER' ? '/provider/dashboard' : '/rider/dashboard';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6" aria-busy="true" aria-label="Loading application">
        <div className="mx-auto max-w-5xl animate-pulse space-y-8">
          <div className="h-10 w-full rounded-lg bg-white" />
          <div className="space-y-4 pt-12">
            <div className="h-8 w-2/3 rounded bg-slate-200" />
            <div className="h-4 w-full max-w-xl rounded bg-slate-200" />
            <div className="h-4 w-4/5 max-w-lg rounded bg-slate-200" />
            <div className="flex gap-3 pt-3">
              <div className="h-11 w-36 rounded-xl bg-slate-200" />
              <div className="h-11 w-36 rounded-xl bg-slate-200" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-48 rounded-2xl bg-white" />
            <div className="h-48 rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-to-use" element={<HowToUse />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={dashboardPath(user.role)} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={!user ? <RegisterRider /> : <Navigate to={dashboardPath(user.role)} />} />
        <Route path="/register-provider" element={!user ? <RegisterProvider /> : <Navigate to={dashboardPath(user.role)} />} />
        
        {/* Protected Rider Routes */}
        <Route 
          path="/rider/dashboard" 
          element={user && user.role === 'RIDER' ? <RiderDashboard /> : <Navigate to="/login" />} 
        />
        
        {/* Provider Dashboard */}
        <Route 
          path="/provider/dashboard" 
          element={user && user.role === 'PROVIDER' ? <ProviderDashboard /> : <Navigate to="/login" />} 
        />

        <Route
          path="/admin/dashboard"
          element={user && user.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" />}
        />
        
        {/* Charging Session Route */}
        <Route 
          path="/session/:id" 
          element={user ? <ChargingSession /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
