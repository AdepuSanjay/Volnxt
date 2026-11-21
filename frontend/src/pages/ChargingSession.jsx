import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Battery, BatteryCharging, Zap, MapPin, CheckCircle, Clock, Star, Download, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChargingSession = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [newBattery, setNewBattery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/charging/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSession(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleUpdateBattery = async () => {
    if (!newBattery) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/charging/${id}/update-battery`, { percentage: Number(newBattery) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewBattery('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndSession = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/charging/${id}/end`, { endBatteryPercentage: session.currentBatteryPercentage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRatingSubmit = async () => {
    setSubmittingRating(true);
    setTimeout(() => {
      navigate(user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard');
    }, 1000);
  };

  if (loading || !session) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
        <p className="text-gray-500 font-bold">Loading session...</p>
      </div>
    </div>
  );

  const progress = ((session.currentBatteryPercentage - session.startBatteryPercentage) / (session.targetBatteryPercentage - session.startBatteryPercentage)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="text-2xl font-black tracking-tighter">VOLNXT</div>
        <div className="text-gray-500 font-bold text-sm bg-gray-100 px-4 py-2 rounded-full">
          ID: {session._id.substring(0,8)}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {session.status !== 'COMPLETED' ? (
            <motion.div 
              key="charging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-10 shadow-sm border border-gray-200 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                <div className="h-full bg-black transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}>
                </div>
              </div>

              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="inline-flex p-6 rounded-full bg-gray-50 border-4 border-gray-100 mb-8 mt-4"
              >
                <BatteryCharging className="h-16 w-16 text-black" />
              </motion.div>
              
              <h2 className="text-4xl font-bold tracking-tight mb-2">Charging</h2>
              <p className="text-gray-500 mb-12 font-medium text-lg">
                {user.role === 'RIDER' ? `at ${session.providerId.name}` : `for ${session.riderId.name}`}
              </p>

              <div className="flex justify-center items-center gap-12 mb-12">
                <div className="text-center">
                  <div className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-2">Current</div>
                  <div className="text-7xl font-black text-black">
                    {session.currentBatteryPercentage}<span className="text-3xl text-gray-400">%</span>
                  </div>
                </div>
                <div className="text-gray-300 text-5xl font-light">→</div>
                <div className="text-center">
                  <div className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-2">Target</div>
                  <div className="text-6xl font-bold text-gray-400">
                    {session.targetBatteryPercentage}<span className="text-2xl">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10 text-left">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-2">Rate</div>
                  <div className="font-black text-2xl text-black">₹{session.priceRate} <span className="text-gray-500 text-lg font-medium">/ {session.pricingModel === 'PER_PERCENTAGE' ? '%' : 'kWh'}</span></div>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-2">Cost so far</div>
                  <div className="font-black text-2xl text-black">
                    ₹{session.pricingModel === 'PER_PERCENTAGE' 
                        ? (session.currentBatteryPercentage - session.startBatteryPercentage) * session.priceRate 
                        : session.estimatedAmount}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    placeholder="Update Battery %" 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 text-black focus:outline-none focus:ring-2 focus:ring-black transition-all text-lg font-medium"
                    value={newBattery}
                    onChange={e => setNewBattery(e.target.value)}
                  />
                  <button onClick={handleUpdateBattery} className="bg-black hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg">
                    Update
                  </button>
                </div>

                <button onClick={handleEndSession} className="w-full bg-gray-100 text-black hover:bg-gray-200 font-bold py-5 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 text-xl">
                  Complete Session
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="receipt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="bg-green-50 p-10 text-center relative border-b border-gray-100">
                <div className="inline-flex bg-green-100 p-4 rounded-full mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-4xl font-black text-black mb-2">Payment done</h2>
                <p className="text-green-700 font-bold text-lg">Session completed successfully</p>
              </div>

              <div className="p-10">
                <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-10">
                  <div className="text-center flex-1 border-r border-gray-100">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Charged</div>
                    <div className="text-3xl font-black text-black">{session.endBatteryPercentage - session.startBatteryPercentage}%</div>
                  </div>
                  <div className="text-center flex-1 border-r border-gray-100">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Time Elapsed</div>
                    <div className="text-3xl font-black text-black">35m</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Paid</div>
                    <div className="text-3xl font-black text-black">₹{session.finalAmount}</div>
                  </div>
                </div>

                <div className="space-y-4 mb-10 text-lg">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Charging Cost</span>
                    <span className="text-black font-bold">₹{session.providerAmount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Platform Fee</span>
                    <span className="text-black font-bold">₹{session.platformFee}</span>
                  </div>
                  <div className="flex justify-between text-black font-black border-t border-gray-200 pt-6 text-xl mt-4">
                    <span>Total Amount Deducted</span>
                    <span>₹{session.finalAmount}</span>
                  </div>
                </div>

                {user.role === 'RIDER' && (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200 mb-10">
                    <h3 className="text-xl font-bold text-black mb-6">Rate your provider</h3>
                    <div className="flex justify-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`h-12 w-12 ${
                              (hoverRating || rating) >= star 
                                ? 'text-black fill-black' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button className="flex-1 bg-gray-100 text-black font-bold py-5 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 text-xl">
                    <Download className="h-6 w-6" /> Receipt
                  </button>
                  <button 
                    onClick={handleRatingSubmit}
                    disabled={submittingRating || (user.role === 'RIDER' && rating === 0)}
                    className="flex-1 bg-black hover:bg-gray-900 text-white font-bold py-5 rounded-xl transition disabled:opacity-50 text-xl"
                  >
                    {submittingRating ? 'Saving...' : 'Done'}
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
