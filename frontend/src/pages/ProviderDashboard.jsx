import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Zap, Clock, CheckCircle, XCircle, LogOut, Image as ImageIcon, Wallet, Activity, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProviderDashboard = () => {
  const { user, extraData, logout } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/requests/provider`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);

        // Also check if an active session is in progress
        const sessionRes = await axios.get(`${API_BASE_URL}/api/charging/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveSession(sessionRes.data || null);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRequests();
    const interval = setInterval(fetchRequests, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/requests/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newStatus = action === 'accept' ? 'ON_THE_WAY' : 'REJECTED';
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkArrived = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/requests/${id}/status`, { status: 'ARRIVED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'ARRIVED' } : r));
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartSession = async (request) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/charging/start`, {
        requestId: request._id,
        startBatteryPercentage: request.batteryStart,
        targetBatteryPercentage: request.targetBattery,
        pricingModel: 'FIXED', 
        priceRate: request.estimatedPrice,
        estimatedAmount: request.estimatedPrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = `/session/${res.data._id}`;
    } catch (error) {
      console.error(error);
      alert('Failed to start session');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('media', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/providers/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadedUrl(res.data.url);
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center transition-all">
        <div className="text-slate-900 font-bold text-lg sm:text-xl tracking-tight">
          VOLNXT <span className="font-medium text-slate-500">Provider</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold border border-slate-200 text-xs sm:text-sm">
              {extraData?.businessName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <span className="text-slate-700 font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
              {extraData?.businessName || user?.name}
            </span>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-red-50">
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10"
        >
          {/* Earnings */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Wallet className="h-24 w-24" />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-slate-500 font-medium text-sm">Today's Earnings</h3>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="text-5xl font-bold text-slate-900 tracking-tight mb-2 relative z-10">₹0</div>
            <div className="text-sm font-medium text-emerald-600 relative z-10 flex items-center gap-1">
              <Activity className="h-4 w-4" /> 0 sessions today
            </div>
          </div>
          
          {/* Status */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 font-medium text-sm">System Status</h3>
              </div>
              <div className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
                Receiving Requests
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Your location is active and visible to nearby riders.
            </div>
          </div>

          {/* Verification */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col">
            <h3 className="text-slate-500 font-medium text-sm mb-4">Verification Media</h3>
            <div className="flex-1 flex flex-col justify-center">
              <label className="cursor-pointer border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all rounded-xl p-4 flex flex-col items-center justify-center gap-2 group">
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-6 w-6 text-blue-500" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </span>
                <span className="text-xs text-slate-400 font-medium text-center">Images or PDF up to 5MB</span>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {uploadedUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs font-medium text-emerald-600 bg-emerald-50 p-2 rounded-lg flex items-center justify-between"
                >
                  <span className="truncate flex-1">Document uploaded</span>
                  <a href={uploadedUrl} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700 ml-2 whitespace-nowrap">View</a>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Active Charging Session Banner */}
        {activeSession && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md animate-pulse">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-base">Active Charging Session in Progress</h4>
                <p className="text-xs text-emerald-100">
                  Charging for {activeSession.riderId?.name || 'Rider'} • Battery at {activeSession.currentBatteryPercentage}%
                </p>
              </div>
            </div>
            <a
              href={`/session/${activeSession._id}`}
              className="inline-flex items-center gap-2 bg-white text-emerald-800 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md hover:bg-emerald-50 transition"
            >
              <span>Open Live Telemetry</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Charging Requests</h2>
          {requests.length > 0 && (
            <div className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {requests.length} Active
            </div>
          )}
        </div>
        
        {requests.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl text-center border border-dashed border-slate-300 flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No requests yet</h3>
            <p className="text-slate-500 font-medium text-sm">Stay online to receive charging requests from nearby riders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {requests.map((request, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  key={request._id} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-full md:w-auto flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                        {request.riderId?.name?.[0]?.toUpperCase() || 'R'}
                      </div>
                      <div>
                        <span className="font-bold text-lg text-slate-900 block">{request.riderId?.name || 'Rider'}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold mt-1 ${
                          request.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          request.status === 'ON_THE_WAY' || request.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                          request.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {request.status === 'ON_THE_WAY' ? 'BIKER DISPATCHED' : request.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Zap className="h-4 w-4 text-amber-500" /> 
                        <span>{request.batteryStart}% <ArrowRight className="h-3 w-3 inline text-slate-400 mx-1"/> {request.targetBattery}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Clock className="h-4 w-4 text-blue-500" /> 
                        <span>{request.estimatedTime} min</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                        <Wallet className="h-4 w-4" /> 
                        <span>₹{request.estimatedPrice}</span>
                      </div>
                    </div>
                  </div>
                  
                  {request.status === 'PENDING' && (
                    <div className="flex gap-2.5 w-full md:w-auto">
                      <button 
                        onClick={() => handleAction(request._id, 'reject')} 
                        className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleAction(request._id, 'accept')} 
                        className="flex-1 md:flex-none bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Zap className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Accept & Dispatch Biker</span>
                      </button>
                    </div>
                  )}
                  
                  {(request.status === 'ON_THE_WAY' || request.status === 'ACCEPTED') && (
                    <div className="flex gap-2.5 w-full md:w-auto">
                      <button 
                        onClick={() => handleMarkArrived(request._id)} 
                        className="flex-1 md:flex-none bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Mark Arrived at Vehicle</span>
                      </button>
                    </div>
                  )}

                  {request.status === 'ARRIVED' && (
                    <button 
                      onClick={() => handleStartSession(request)} 
                      className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 animate-pulse"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Plug In & Start Charging</span>
                    </button>
                  )}

                  {request.status === 'CHARGING' && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      ⚡ Charging Session Active
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProviderDashboard;
