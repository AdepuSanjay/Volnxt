import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Zap, ShieldCheck, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // Navigation is handled automatically by AuthContext or App.jsx routing
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-black selection:text-white">
      
      {/* Left Column: Authentication Form */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-4 sm:p-10 lg:p-14 z-10 bg-white">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-12">
            <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-black hover:opacity-80 transition">
              VOLNXT
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <Link 
                to="/how-to-use" 
                className="inline-flex items-center text-[11px] sm:text-xs font-bold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition"
              >
                How to Use
              </Link>
              <Link 
                to="/" 
                className="inline-flex items-center text-[11px] sm:text-xs font-semibold text-gray-500 hover:text-black transition px-1.5 py-1"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Home
              </Link>
            </div>
          </div>

          {/* Form Header */}
          <div className="max-w-md mx-auto lg:mx-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Sign In
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 font-medium mb-8">
              Sign in to manage your charging requests, view live telemetry, or manage host stations.
            </p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-700 p-4 mb-6 text-xs sm:text-sm font-semibold border-l-4 border-red-600 rounded-r-lg"
              >
                {error}
              </motion.div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="text-sm font-semibold">@</span>
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-9 pr-4 py-3.5 bg-gray-50 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition text-sm rounded-xl font-medium"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-emerald-700 hover:text-black font-semibold transition">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition text-sm rounded-xl font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 text-sm font-bold text-white bg-black hover:bg-gray-900 rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <span>Continue to Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                New to VOLNXT?{' '}
                <div className="inline-flex flex-wrap gap-2 mt-1">
                  <Link to="/register" className="text-black font-bold hover:underline">
                    Sign up as EV Rider
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link to="/register-provider" className="text-emerald-600 font-bold hover:underline">
                    Register as Host Provider
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-xs text-gray-400">
          © 2026 VOLNXT Technologies. Secure end-to-end encrypted dispatch grid.
        </div>
      </div>

      {/* Right Column: Dynamic Visual Hero Panel (Image + Real-Time Telemetry) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-neutral-950 overflow-hidden items-end p-12 lg:p-16">
        
        {/* Cinematic EV Charging Image */}
        <img
          src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80"
          alt="VOLNXT High-Speed Electric Vehicle Charging"
          className="absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-1000 scale-105 hover:scale-100"
        />

        {/* Gradient Overlay for high-contrast typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />

        {/* Top-right Live Badge */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
          <div className="backdrop-blur-md bg-black/60 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Grid Status: Optimal</span>
          </div>
        </div>

        {/* Floating Content Card over Image */}
        <div className="relative z-10 max-w-lg text-left text-white">
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-4">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            Decentralized Mobile EV Charging
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 leading-snug">
            Power on demand. Anywhere your journey takes you.
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 font-normal">
            Whether stranded on a highway or parked at home, request high-speed mobile charging vans or connect to verified neighborhood hosts with one tap.
          </p>

          {/* Real-time stats strip */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl">
            <div>
              <div className="text-lg font-black text-white">&lt; 15 min</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Avg Dispatch</div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <div className="text-lg font-black text-emerald-400">50+ kW</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">DC Fast Speed</div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <div className="text-lg font-black text-white">99.8%</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Grid Uptime</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
