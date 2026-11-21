import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import RiderDashboard from './pages/RiderDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import ChargingSession from './pages/ChargingSession';

import RegisterRider from './pages/RegisterRider';
import RegisterProvider from './pages/RegisterProvider';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard'} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={!user ? <RegisterRider /> : <Navigate to={user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard'} />} />
        <Route path="/register-provider" element={!user ? <RegisterProvider /> : <Navigate to={user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard'} />} />
        
        {/* Protected Rider Routes */}
        <Route 
          path="/rider/dashboard" 
          element={user && user.role === 'RIDER' ? <RiderDashboard /> : <Navigate to="/login" />} 
        />
        
        {/* Provider Dashboard */}
        <Route 
          path="/provider/dashboard" 
          element={user && (user.role === 'PROVIDER' || user.role === 'ADMIN') ? <ProviderDashboard /> : <Navigate to="/login" />} 
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
