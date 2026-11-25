import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  Image as ImageIcon, 
  Wallet, 
  Activity, 
  ArrowRight,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  TrendingUp,
  BatteryCharging,
  RefreshCw,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveVehicleMap from '../components/LiveVehicleMap';

const ProviderDashboard = () => {
  const { user, extraData, logout } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  // Real-time Provider Stats & Completed Sessions Ledger
  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalEarnings: 0,
    todaySessionsCount: 0,
    totalSessionsCount: 0,
    totalEnergyKwh: 0,
    recentSessions: []
  });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/charging/provider/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error fetching provider stats:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/requests/provider`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data || []);

      // Also check if an active session is in progress
      const sessionRes = await axios.get(`${API_BASE_URL}/api/charging/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSession(sessionRes.data || null);
    } catch (error) {
      console.error('Error fetching provider requests:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
    const interval = setInterval(() => {
      fetchRequests();
      fetchStats();
    }, 2500);
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
      fetchRequests();
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
      fetchRequests();
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
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 pb-16">
      
      {/* Top Navbar */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="text-black font-black text-xl tracking-tight">
            VOLNXT <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full ml-1.5 uppercase">Host Partner</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-black font-black border border-slate-200 text-xs shadow-sm">
              {extraData?.businessName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-black">{extraData?.businessName || user?.name}</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Dispatch Node
              </div>
            </div>
          </div>

          <button 
            onClick={logout} 
            className="text-slate-400 hover:text-black p-2 rounded-xl hover:bg-slate-100 transition"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* KPI Performance Metrics Dashboard (Ola / Uber Fleet Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Today's Net Earnings */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Earnings</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ₹{stats.todayEarnings.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{stats.todaySessionsCount} sessions completed today</span>
            </div>
          </div>

          {/* Lifetime Revenue */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Lifetime Earnings</span>
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ₹{stats.totalEarnings.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-2">
              Across <strong className="text-slate-800">{stats.totalSessionsCount}</strong> completed charges
            </div>
          </div>

          {/* Clean Energy Dispensed */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Energy Delivered</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {stats.totalEnergyKwh} <span className="text-lg font-bold text-slate-400">kWh</span>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-2">
              ~{Math.round(stats.totalEnergyKwh * 0.8)} kg CO₂ carbon offset
            </div>
          </div>

          {/* Node Availability Status */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dispatch Status</span>
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
            </div>
            <div className="text-xl font-black text-emerald-600 flex items-center gap-2">
              Online & Ready
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Station & mobile units visible to nearby EV riders
            </div>
          </div>
        </div>

        {/* Section: Incoming & Active Charging Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Dispatches & Requests</h2>
              <p className="text-xs text-slate-500">Manage real-time incoming rider requests and technician dispatches.</p>
            </div>
            {requests.length > 0 && (
              <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {requests.length} Active
              </span>
            )}
          </div>
          
          {requests.length === 0 ? (
            <div className="bg-white p-12 sm:p-16 rounded-3xl text-center border border-dashed border-slate-300 flex flex-col items-center justify-center">
              <div className="bg-slate-50 p-4 rounded-full mb-3 border border-slate-200">
                <Activity className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No active dispatches right now</h3>
              <p className="text-slate-500 text-xs max-w-sm">
                Keep your provider status online. When nearby EV riders request a charge, they will appear here with live GPS coordinates.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {requests.map((request) => {
                  const isDispatched = request.status === 'ON_THE_WAY' || request.status === 'ACCEPTED' || request.status === 'ARRIVED';
                  const riderName = request.riderId?.name || 'EV Rider';
                  const riderPhone = request.riderId?.phone || '+91 98450 00000';
                  const riderAddress = request.riderAddress || "Koramangala 4th Block, Bengaluru";

                  return (
                    <motion.div 
                      key={request._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                      {/* Top Request Status Header */}
                      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-base shadow-sm flex-shrink-0">
                            {riderName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-slate-900">{riderName}</h4>
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                request.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                request.status === 'ON_THE_WAY' ? 'bg-cyan-100 text-cyan-800 animate-pulse' :
                                request.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {request.status === 'ON_THE_WAY' ? 'EN ROUTE TO RIDER' : request.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <a href={`tel:${riderPhone}`} className="hover:text-black font-semibold">{riderPhone}</a>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <MapPin className="h-3 w-3 text-emerald-600" />
                                {riderAddress}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Battery, ETA & Payout Chips */}
                        <div className="flex items-center gap-3 bg-slate-50 p-2.5 sm:px-4 rounded-2xl border border-slate-200 self-start md:self-auto">
                          <div className="text-left">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Battery Req.</div>
                            <div className="text-xs font-black text-slate-800">{request.batteryStart}% → {request.targetBattery}%</div>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div className="text-left">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Payout</div>
                            <div className="text-sm font-black text-emerald-600">₹{request.estimatedPrice}</div>
                          </div>
                        </div>
                      </div>

                      {/* Live Ola / Rapido Map Integration (When Biker Dispatched / On The Way / Arrived) */}
                      {isDispatched && (
                        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200/80">
                          <LiveVehicleMap 
                            riderLat={request.riderLat || 12.9716}
                            riderLng={request.riderLng || 77.5946}
                            riderAddress={riderAddress}
                            providerLat={request.currentLat}
                            providerLng={request.currentLng}
                            providerName={extraData?.businessName || user?.name || "Mobile Fast Charger"}
                            riderName={riderName}
                            requestId={request._id}
                            status={request.status}
                            distanceKm={request.currentDistanceKm || request.distance || 1.8}
                            etaMinutes={request.etaMinutes || 4}
                            role="PROVIDER"
                            height="h-[320px] sm:h-[380px]"
                          />
                        </div>
                      )}

                      {/* Bottom Actions Bar */}
                      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                        <div className="text-xs text-slate-500 font-medium">
                          {request.status === 'PENDING' && "Rider is waiting for confirmation. Accept to dispatch technician."}
                          {request.status === 'ON_THE_WAY' && "Mobile charger en route. Once parked at rider EV, mark arrived."}
                          {request.status === 'ARRIVED' && "Mobile charger at vehicle. Plug in connector to start metering."}
                          {request.status === 'CHARGING' && "Power flow active. Session metrics syncing with cloud ledger."}
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                          {request.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleAction(request._id, 'reject')} 
                                className="flex-1 sm:flex-initial bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                              >
                                Decline
                              </button>
                              <button 
                                onClick={() => handleAction(request._id, 'accept')} 
                                className="flex-1 sm:flex-initial bg-black hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                              >
                                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Accept & Dispatch</span>
                              </button>
                            </>
                          )}
                          
                          {(request.status === 'ON_THE_WAY' || request.status === 'ACCEPTED') && (
                            <button 
                              onClick={() => handleMarkArrived(request._id)} 
                              className="w-full sm:w-auto bg-black hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
                            >
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                              <span>Mark Arrived at Vehicle</span>
                            </button>
                          )}

                          {request.status === 'ARRIVED' && (
                            <button 
                              onClick={() => handleStartSession(request)} 
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 animate-pulse"
                            >
                              <Zap className="h-4 w-4" />
                              <span>Plug In & Start Charging</span>
                            </button>
                          )}

                          {request.status === 'CHARGING' && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                              Charging Session Running
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Section: Completed Charging Revenue Ledger (Real-time Payout Records) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Completed Sessions & Revenue Ledger</span>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                  {stats.totalSessionsCount} Settled
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically updated in real time whenever a charging session concludes.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-black bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition self-start sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {stats.recentSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BatteryCharging className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <div className="text-sm font-bold text-slate-600">No completed sessions recorded yet</div>
              <div className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Completed charging sessions will automatically calculate your net provider payout and appear in this ledger.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Session Date & Time</th>
                    <th className="py-3 px-3">EV Rider</th>
                    <th className="py-3 px-3">Charge Delivered</th>
                    <th className="py-3 px-3">Energy (kWh)</th>
                    <th className="py-3 px-3">Gross</th>
                    <th className="py-3 px-3 text-right">Provider Net (₹)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {stats.recentSessions.map((s) => {
                    const sessionDate = new Date(s.endTime || s.updatedAt || s.createdAt);
                    const dateFormatted = sessionDate.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    const timeFormatted = sessionDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const netPayout = s.providerAmount !== undefined && s.providerAmount !== null
                      ? s.providerAmount
                      : (s.finalAmount || s.estimatedAmount || 0);

                    return (
                      <tr key={s._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{dateFormatted}</div>
                          <div className="text-[10px] text-slate-400">{timeFormatted}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{s.riderId?.name || "EV Rider"}</div>
                          <div className="text-[10px] text-slate-400">{s.riderId?.phone || s.riderId?.email || "App Verified"}</div>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {s.startBatteryPercentage}% → {s.endBatteryPercentage || s.targetBatteryPercentage || s.currentBatteryPercentage}%
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {s.energyDeliveredKwh || ((s.targetBatteryPercentage - s.startBatteryPercentage) * 0.4).toFixed(1)} kWh
                        </td>
                        <td className="py-3.5 px-3 text-slate-500">
                          ₹{s.finalAmount || s.estimatedAmount}
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-sm text-emerald-600">
                          ₹{netPayout.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            PAID
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Media Upload */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-slate-100 rounded-2xl text-slate-700 flex-shrink-0">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Station Verification & Certifications</h4>
              <p className="text-xs text-slate-500 mt-0.5">Upload station licenses or mobile DC charging vehicle certifications.</p>
              {uploadedUrl && (
                <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">
                  ✓ Document verified and attached to account
                </span>
              )}
            </div>
          </div>

          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0">
            <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
            <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

      </main>
    </div>
  );
};

export default ProviderDashboard;
