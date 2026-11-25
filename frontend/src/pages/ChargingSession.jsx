import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Battery, 
  BatteryCharging, 
  Zap, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Star, 
  Download, 
  Activity,
  Gauge,
  Flame,
  ShieldCheck,
  Radio,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const loadRazorpayCheckout = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const ChargingSession = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [newBattery, setNewBattery] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Real-time telemetry state
  const [chargingSpeed, setChargingSpeed] = useState(29.4); // kW
  const [voltage, setVoltage] = useState(382); // V
  const [current, setCurrent] = useState(77.2); // A
  const [energyDelivered, setEnergyDelivered] = useState(0); // kWh
  const [telemetryLogs, setTelemetryLogs] = useState([
    { time: '00:01', msg: 'CCS2 High-Voltage Connector locked & grounded' },
    { time: '00:03', msg: 'Vehicle BMS handshake acknowledged (CAN protocol)' },
    { time: '00:06', msg: 'High-current DC power flow established' }
  ]);
  const [isAutoCharging, setIsAutoCharging] = useState(user?.role === 'PROVIDER');

  // Rating & completion state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Fetch session data with fast 2-second polling for live sync
  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/charging/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (isMounted) {
          setSession(res.data);
          if (res.data.energyDeliveredKwh !== undefined) {
            setEnergyDelivered(res.data.energyDeliveredKwh);
          }
          if (res.data.chargingPowerKw !== undefined) {
            setChargingSpeed(res.data.chargingPowerKw);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  // Live Auto-Telemetry Simulation: ticks battery and energy up smoothly
  useEffect(() => {
    if (!session || ['PAYMENT_PENDING', 'COMPLETED'].includes(session.status) || !isAutoCharging) return;

    const timer = setInterval(() => {
      // Dynamic power oscillation
      const fluctuatedPower = Number((28.8 + Math.random() * 2.2).toFixed(1));
      const fluctuatedVolt = Math.round(380 + Math.random() * 6);
      const fluctuatedAmp = Number((fluctuatedPower * 1000 / fluctuatedVolt).toFixed(1));

      setChargingSpeed(fluctuatedPower);
      setVoltage(fluctuatedVolt);
      setCurrent(fluctuatedAmp);

      // Only increment battery if below target
      if (session.currentBatteryPercentage < session.targetBatteryPercentage) {
        const nextBattery = session.currentBatteryPercentage + 1;
        const pctAdded = nextBattery - session.startBatteryPercentage;
        const nextEnergy = Number(((pctAdded / 100) * 42).toFixed(2)); // ~42 kWh pack

        setEnergyDelivered(nextEnergy);
        setSession(prev => ({ ...prev, currentBatteryPercentage: nextBattery, energyDeliveredKwh: nextEnergy }));

        // Append log periodically
        if (nextBattery % 5 === 0) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setTelemetryLogs(prev => [
            { time: nowStr, msg: `Battery surge: ${nextBattery}% • ${nextEnergy} kWh delivered` },
            ...prev.slice(0, 5)
          ]);
        }

        // Push to server so other connected party sees it instantly
        try {
          const token = localStorage.getItem('token');
          axios.put(`${API_BASE_URL}/api/charging/${id}/update-battery`, {
            percentage: nextBattery,
            powerKw: fluctuatedPower,
            voltage: fluctuatedVolt,
            current: fluctuatedAmp,
            energyKwh: nextEnergy
          }, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        } catch (e) {}

      } else if (session.currentBatteryPercentage >= session.targetBatteryPercentage) {
        // Target reached
        clearInterval(timer);
      }
    }, 2800);

    return () => clearInterval(timer);
  }, [session, isAutoCharging, id]);

  const handleUpdateBattery = async () => {
    if (!newBattery) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/charging/${id}/update-battery`, { 
        percentage: Number(newBattery),
        powerKw: chargingSpeed,
        voltage,
        current
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(res.data);
      setNewBattery('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndSession = async () => {
    setEndingSession(true);
    setPaymentError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE_URL}/api/charging/${id}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(res.data);
    } catch (error) {
      console.error(error);
      setPaymentError(error.response?.data?.message || 'Could not stop the charging session. Please try again.');
    } finally {
      setEndingSession(false);
    }
  };

  const handlePayNow = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const orderResponse = await axios.post(`${API_BASE_URL}/api/payments/order`, { sessionId: id }, { headers });
      const order = orderResponse.data;
      const checkoutLoaded = await loadRazorpayCheckout();
      if (!checkoutLoaded) throw new Error('Razorpay Checkout could not be loaded. Check your internet connection.');

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'VOLNXT',
        description: `Charging session ${String(id).slice(-8)}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: { color: '#047857' },
        handler: async (paymentResponse) => {
          try {
            const verificationResponse = await axios.post(`${API_BASE_URL}/api/payments/verify`, paymentResponse, { headers });
            setSession(verificationResponse.data.session);
          } catch (error) {
            setPaymentError(error.response?.data?.message || 'Payment was received but could not be verified. Please retry or contact support.');
          }
        },
        modal: {
          ondismiss: () => setPaymentLoading(false)
        }
      });
      checkout.on('payment.failed', (event) => {
        setPaymentError(event.error?.description || 'Payment failed. You can try again.');
      });
      checkout.open();
    } catch (error) {
      setPaymentError(error.response?.data?.message || error.message || 'Could not start payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    setSubmittingRating(true);
    setTimeout(() => {
      navigate(user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard');
    }, 800);
  };

  if (loading || !session) return (
    <div className="min-h-screen bg-slate-50/50 font-sans" aria-busy="true" aria-label="Loading charging session">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex justify-between items-center">
        <div className="h-7 w-28 rounded bg-gray-200 animate-pulse" />
        <div className="h-8 w-24 rounded-full bg-gray-100 animate-pulse" />
      </nav>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 animate-pulse">
          <div className="h-2 w-full rounded-full bg-gray-100" />
          <div className="space-y-3">
            <div className="h-7 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
          </div>
          <div className="h-48 rounded-2xl bg-gray-100" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </main>
    </div>
  );

  const startPct = session.startBatteryPercentage || 15;
  const targetPct = session.targetBatteryPercentage || 80;
  const currentPct = session.currentBatteryPercentage || startPct;
  const progress = Math.min(100, Math.max(0, ((currentPct - startPct) / (targetPct - startPct)) * 100));

  // Running live cost calculation
  const runningCost = session.pricingModel === 'PER_PERCENTAGE'
    ? Math.round(Math.max(0, currentPct - startPct) * session.priceRate)
    : Math.round(energyDelivered * (session.priceRate || 18));

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-black selection:text-white pb-12">
      {/* Top Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="text-xl sm:text-2xl font-black tracking-tighter text-black">VOLNXT</div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-bold text-xs bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 hidden sm:inline">
            ID: {session._id.substring(0, 8)}
          </span>
          <button
            onClick={() => navigate(user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard')}
            className="text-xs font-bold text-gray-500 hover:text-black py-1 px-3 rounded-lg hover:bg-gray-100 transition"
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {session.status === 'PAYMENT_PENDING' ? (
            <motion.div
              key="payment-pending"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-3xl border border-gray-200 bg-white text-center shadow-xl"
            >
              <div className="border-b border-blue-100 bg-blue-50 px-5 py-8 sm:px-8">
                <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4 text-blue-700"><ShieldCheck className="h-9 w-9" /></div>
                <h2 className="text-2xl font-black text-black sm:text-3xl">Charging complete</h2>
                <p className="mt-2 text-sm font-medium text-slate-600">{user?.role === 'RIDER' ? 'Review and complete your secure online payment.' : 'Waiting for the rider to complete payment.'}</p>
              </div>
              <div className="p-5 sm:p-8">
                <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Amount due</div>
                  <div className="mt-1 text-4xl font-black text-emerald-700">₹{session.finalAmount}</div>
                  <div className="mt-2 text-xs text-gray-500">Includes a platform fee of ₹{session.platformFee}</div>
                </div>
                {paymentError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">{paymentError}</p>}
                {user?.role === 'RIDER' ? (
                  <button type="button" onClick={handlePayNow} disabled={paymentLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 text-base font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                    {paymentLoading ? 'Opening secure checkout…' : `Pay ₹${session.finalAmount} securely`}
                  </button>
                ) : (
                  <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">The rider will see the payment request in their active session.</p>
                )}
              </div>
            </motion.div>
          ) : session.status !== 'COMPLETED' ? (
            <motion.div 
              key="charging"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-200/80 overflow-hidden text-center"
            >
              {/* Animated Top Flow Bar */}
              <div className="relative w-full h-2 bg-gray-100 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Header Status */}
              <div className="p-6 sm:p-8 pb-4">
                <div className="inline-flex items-center gap-2 bg-black text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                  <Zap className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                  High-Speed Power Delivery Active
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                  {user.role === 'RIDER' ? `Charging via ${session.providerId?.name || 'Mobile Station'}` : `Charging for ${session.riderId?.name || 'EV Rider'}`}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                  High-output DC Fast charging with live telemetry synchronization.
                </p>
              </div>

              {/* Big Central Battery Visual */}
              <div className="px-6 py-6 bg-gradient-to-b from-white via-slate-50 to-white border-y border-gray-100 flex flex-col items-center justify-center">
                
                {/* Battery Circular Pulse Visual */}
                <div className="relative flex items-center justify-center mb-6">
                  {/* Outer Pulsing Glow */}
                  <div className="absolute h-44 w-44 rounded-full border-2 border-emerald-400/40 animate-ping opacity-25" />
                  <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-gradient-to-tr from-gray-950 to-slate-900 flex flex-col items-center justify-center text-white shadow-2xl border-4 border-emerald-400">
                    <BatteryCharging className="h-8 w-8 text-emerald-400 mb-1 animate-pulse" />
                    <div className="text-4xl sm:text-5xl font-black tracking-tight">
                      {currentPct}<span className="text-2xl font-bold text-emerald-400">%</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Target: {targetPct}%
                    </span>
                  </div>
                </div>

                {/* Battery Range Progress Line */}
                <div className="w-full max-w-md px-4">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                    <span>Started at {startPct}%</span>
                    <span className="text-emerald-600">+{currentPct - startPct}% Gained</span>
                    <span>Goal: {targetPct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden p-0.5 border border-gray-300">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Telemetry Metrics Grid (Power, Voltage, Current, Cost) */}
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white text-left">
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Power Output
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-black mt-1">
                    {chargingSpeed} <span className="text-xs font-bold text-gray-500">kW</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">DC Fast Standard</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-blue-500" />
                    Voltage & Flow
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-black mt-1">
                    {voltage} <span className="text-xs font-bold text-gray-500">V</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5">{current} Amperes</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <Battery className="h-3.5 w-3.5 text-emerald-600" />
                    Energy Delivered
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-black mt-1">
                    {energyDelivered} <span className="text-xs font-bold text-gray-500">kWh</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5">~{Math.round(energyDelivered * 5.5)} km added</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <span className="text-sm font-bold leading-none text-emerald-600">₹</span>
                    Live Running Cost
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                    ₹{runningCost || session.estimatedAmount}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5">₹{session.priceRate}/unit</div>
                </div>

              </div>

              {/* Live Telemetry Terminal Feed */}
              <div className="px-6 py-4 bg-slate-900 text-left text-xs font-mono text-emerald-400 mx-6 rounded-2xl border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Diagnostic Telemetry Stream
                  </span>
                  <span>CAN Bus 2.0</span>
                </div>
                <div className="space-y-1">
                  {telemetryLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px]">
                      <span className="text-gray-500">[{log.time}]</span>
                      <span className="text-emerald-300 font-medium">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Controls & Session Actions */}
              {user?.role === 'PROVIDER' ? <div className="p-6 space-y-4">
                
                {/* Manual Battery Override & Speed Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Set Battery % manually" 
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-black text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                      value={newBattery}
                      onChange={e => setNewBattery(e.target.value)}
                    />
                    <button 
                      onClick={handleUpdateBattery} 
                      className="bg-black hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                    >
                      Update
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAutoCharging(!isAutoCharging)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                      isAutoCharging 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {isAutoCharging ? 'Auto-Simulation: ON' : 'Auto-Simulation: PAUSED'}
                  </button>
                </div>

                {/* Stop / Complete Session Button */}
                <button 
                  onClick={handleEndSession} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-base"
                >
                  <Zap className="h-5 w-5" />
                  <span>{endingSession ? 'Ending session…' : 'Stop Charging & Request Payment'}</span>
                </button>
              </div> : <div className="px-6 pb-6 text-center text-sm font-medium text-slate-500">Your provider is updating the charging session. Payment will be available when charging ends.</div>}
            </motion.div>
          ) : (
            /* ================= COMPLETED RECEIPT VIEW ================= */
            <motion.div 
              key="receipt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden text-center"
            >
              <div className="bg-emerald-50 p-8 sm:p-10 text-center relative border-b border-emerald-100">
                <div className="inline-flex bg-emerald-100 p-4 rounded-full mb-4 shadow-sm">
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-black mb-1">Charging Session Complete</h2>
                <p className="text-emerald-700 font-bold text-sm sm:text-base">
                  Payment verified securely with Razorpay.
                </p>
              </div>

              <div className="p-6 sm:p-10 text-left">
                <div className="grid grid-cols-3 gap-2 mb-8 border-b border-gray-100 pb-8 text-center">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Energy Added</div>
                    <div className="text-xl sm:text-2xl font-black text-black">
                      {(session.endBatteryPercentage || currentPct) - session.startBatteryPercentage}%
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Units (kWh)</div>
                    <div className="text-xl sm:text-2xl font-black text-black">
                      {session.energyDeliveredKwh || energyDelivered || 14.5} <span className="text-xs font-normal">kWh</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Paid</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600">
                      ₹{session.finalAmount || runningCost}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8 text-sm">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Provider Earnings</span>
                    <span className="text-black font-bold">₹{session.providerAmount || Math.round((session.finalAmount || runningCost) * 0.9)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>VOLNXT Safety & Network Fee</span>
                    <span className="text-black font-bold">₹{session.platformFee || Math.round((session.finalAmount || runningCost) * 0.1)}</span>
                  </div>
                  <div className="flex justify-between text-black font-black border-t border-gray-200 pt-4 text-base">
                    <span>Total Amount Settled</span>
                    <span className="text-emerald-700">₹{session.finalAmount || runningCost}</span>
                  </div>
                </div>

                {user.role === 'RIDER' && (
                  <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200 mb-8">
                    <h3 className="text-sm sm:text-base font-bold text-black mb-3">Rate your charging experience</h3>
                    <div className="flex justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none transition-transform hover:scale-125"
                        >
                          <Star 
                            className={`h-8 w-8 sm:h-9 sm:w-9 ${
                              (hoverRating || rating) >= star 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={handleRatingSubmit}
                    disabled={submittingRating}
                    className="flex-1 bg-black hover:bg-gray-900 text-white font-bold py-4 rounded-xl transition text-sm shadow-md"
                  >
                    {submittingRating ? 'Saving...' : 'Back to Dashboard'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ChargingSession;
