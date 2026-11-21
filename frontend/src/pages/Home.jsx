import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, BatteryCharging, ShieldCheck, ArrowRight, Zap, 
  Play, Pause, DollarSign, Clock, Navigation, Radio, Compass, Car,
  Smartphone, Star, CheckCircle2, ChevronRight, Activity, Gauge,
  HelpCircle, X, Menu, Globe, LogOut, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import HowToUseModal from '../components/HowToUseModal';

// Resilient Video / Image Media Component
const VideoPlayerCard = ({ 
  src, 
  secondarySrc,
  imageSrc,
  fallbackPoster = "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80", 
  badgeText, 
  title, 
  subtitle, 
  hudElement, 
  aspectRatio = "aspect-[16/10]",
  defaultMode = "video",
  allowToggle = true
}) => {
  const [mode, setMode] = useState(defaultMode);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const activeImage = imageSrc || fallbackPoster;

  return (
    <div className={`relative rounded-3xl overflow-hidden shadow-2xl bg-neutral-950 border border-white/10 ${aspectRatio} group`}>
      {/* Media Layer: Video or Image */}
      {mode === 'video' && !hasError && src ? (
        <video
          ref={videoRef}
          poster={activeImage}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        >
          <source src={src} type="video/mp4" />
          {secondarySrc && <source src={secondarySrc} type="video/mp4" />}
        </video>
      ) : (
        <img
          src={activeImage}
          alt={title || "VOLNXT EV Charging"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Cinematic dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/30 pointer-events-none" />

      {/* Top status bar inside media card */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
        {badgeText && (
          <span className="backdrop-blur-md bg-white/20 text-white text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {badgeText}
          </span>
        )}

        <div className="flex items-center gap-2">
          {allowToggle && src && (
            <div className="flex bg-black/60 backdrop-blur-md border border-white/15 rounded-full p-0.5 text-xs text-white">
              <button
                type="button"
                onClick={() => { setMode('video'); setHasError(false); }}
                className={`px-2.5 py-1 rounded-full font-bold transition text-[11px] ${
                  mode === 'video' && !hasError ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Video
              </button>
              <button
                type="button"
                onClick={() => setMode('image')}
                className={`px-2.5 py-1 rounded-full font-bold transition text-[11px] ${
                  mode === 'image' || hasError ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Image
              </button>
            </div>
          )}

          {mode === 'video' && !hasError && src && (
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="h-8 w-8 rounded-full backdrop-blur-md bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-lg"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white ml-0.5" />}
            </button>
          )}
        </div>
      </div>

      {/* HUD Telemetry Overlay Widget (Only rendered if supplied) */}
      {hudElement && (
        <div className="absolute bottom-16 right-4 z-10 hidden sm:block">
          {hudElement}
        </div>
      )}

      {/* Bottom text overlay */}
      {(title || subtitle) && (
        <div className="absolute bottom-5 left-5 right-5 z-10 pointer-events-none text-left">
          {title && <h4 className="text-white font-bold text-lg leading-tight mb-1">{title}</h4>}
          {subtitle && <p className="text-white/70 text-xs font-normal leading-relaxed">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};

// Dynamic Interactive Workflow Animation Studio (Directly represents the 3 steps)
const WorkflowAnimationStage = ({ activeStep, isPlaying, onTogglePlay, onSelectStep }) => {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-[#090b10] border border-white/10 aspect-[4/3] sm:aspect-[16/11] flex flex-col justify-between p-6 select-none">
      
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293712_1px,transparent_1px),linear-gradient(to_bottom,#1f293712_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

      {/* Top HUD Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="backdrop-blur-md bg-white/10 text-white text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-2 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {activeStep === 0 && "Step 01 • GPS Location Request"}
            {activeStep === 1 && "Step 02 • Proximity Smart Matching"}
            {activeStep === 2 && "Step 03 • Fast Plug-In & Energy Delivery"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-0.5 text-xs text-white">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => onSelectStep(idx)}
                className={`px-2.5 py-1 rounded-full font-bold transition text-[11px] ${
                  activeStep === idx ? "bg-white text-black shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                0{idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={onTogglePlay}
            className="h-8 w-8 rounded-full backdrop-blur-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
            title={isPlaying ? "Pause auto-progression" : "Play auto-progression"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Dynamic Animated Stage Visuals based on Active Step */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-4 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STAGE 01: GPS ACQUISITION ANIMATION */}
          {activeStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              {/* Concentric Radar Pulsing Waves */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.8, 2.5], opacity: [0.8, 0.3, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-emerald-400/40 bg-emerald-500/10"
                />
                <motion.div 
                  animate={{ scale: [1, 1.4, 2.0], opacity: [0.8, 0.3, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-cyan-400/40"
                />
                
                {/* Rotating scanner beam */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex justify-center"
                >
                  <div className="w-0.5 h-1/2 bg-gradient-to-t from-emerald-400 to-transparent" />
                </motion.div>

                {/* Concentric grid rings */}
                <div className="absolute inset-4 rounded-full border border-white/10" />
                <div className="absolute inset-16 rounded-full border border-dashed border-emerald-500/30" />

                {/* Central Car Pin Node */}
                <div className="relative z-20 flex flex-col items-center">
                  <motion.div 
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="p-3.5 bg-emerald-500 text-black rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.7)] border-2 border-white/80"
                  >
                    <Car className="h-7 w-7 text-black" />
                  </motion.div>
                </div>
              </div>

              {/* Coordinates Badge */}
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-center gap-2 shadow-xl"
              >
                <Compass className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                <span>GPS LOCK: 12.9716° N, 77.5946° E (±1.2m)</span>
              </motion.div>
            </motion.div>
          )}

          {/* STAGE 02: PROXIMITY SMART MATCHING ANIMATION */}
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full max-w-sm h-52 flex items-center justify-between px-6">
                
                {/* SVG Route Connecting Line with flowing energy particles */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 380 200">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  
                  {/* Base Route Path */}
                  <path
                    d="M 70,140 Q 190,50 310,60"
                    fill="transparent"
                    stroke="#1f2937"
                    strokeWidth="4"
                  />
                  
                  {/* Glowing active path */}
                  <motion.path
                    d="M 70,140 Q 190,50 310,60"
                    fill="transparent"
                    stroke="url(#routeGradient)"
                    strokeWidth="4"
                    strokeDasharray="8 6"
                    animate={{ strokeDashoffset: [-100, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </svg>

                {/* Left Node: Rider's EV */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-3 bg-neutral-800 text-white rounded-2xl border border-white/20 shadow-xl">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 mt-2 bg-black/70 px-2 py-0.5 rounded-full border border-white/10">
                    Your Vehicle
                  </span>
                </div>

                {/* Center Route Status Telemetry */}
                <div className="relative z-10 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-cyan-500/40 text-center shadow-2xl">
                  <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Smart Matched</div>
                  <div className="text-xs font-black text-white">0.8 km • ~4 mins</div>
                </div>

                {/* Right Node: Mobile Fast Charging Van */}
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="p-3 bg-cyan-500 text-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.6)] border-2 border-white"
                  >
                    <Zap className="h-6 w-6 text-black fill-black" />
                  </motion.div>
                  <span className="text-[10px] font-bold text-cyan-300 mt-2 bg-black/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Van #402 (50 kW)
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 03: FAST PLUG-IN & REAL-TIME POWER GAIN */}
          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-8">
                
                {/* Circular Animated Battery Gauge */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-neutral-800"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      stroke="#10b981"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray="251.2"
                      animate={{ strokeDashoffset: [160, 50, 50] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </svg>
                  
                  <div className="absolute flex flex-col items-center">
                    <motion.div 
                      animate={{ scale: [1, 1.25, 1] }} 
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                    <div className="text-xl font-black text-white mt-0.5">80%</div>
                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Fast Charge</div>
                  </div>
                </div>

                {/* Real-time Telemetry Stats */}
                <div className="space-y-2 text-left">
                  <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Charging Power</div>
                    <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
                      <span>50.4 kW</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-white/10 px-1.5 py-0.2 rounded">DC CCS2</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Energy Delivered</div>
                    <div className="text-base font-extrabold text-white">+38.2 kWh</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs text-gray-300">
                    <span>Rate: ₹15 / kWh</span>
                    <span className="text-emerald-400 font-bold">Auto-Paid</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Live Action Status Strip */}
      <div className="relative z-10 bg-black/70 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl flex items-center justify-between text-left text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 text-black rounded-xl">
            {activeStep === 0 && <Navigation className="h-4 w-4" />}
            {activeStep === 1 && <Radio className="h-4 w-4 animate-pulse" />}
            {activeStep === 2 && <BatteryCharging className="h-4 w-4" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {activeStep === 0 && "Locating Vehicle • Sub-meter GPS Accuracy"}
              {activeStep === 1 && "Provider Matched • Mobile Van En Route"}
              {activeStep === 2 && "Session in Progress • +38 kWh Delivered (50 kW)"}
            </div>
            <div className="text-[11px] text-gray-400">
              {activeStep === 0 && "One-tap request signals all nearby active provider units"}
              {activeStep === 1 && "Optimized routing matches nearest mobile charging van"}
              {activeStep === 2 && "Full compatibility with Tata, MG, Ather, Mahindra & luxury EVs"}
            </div>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            ● Seamless
          </span>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [howToUseTab, setHowToUseTab] = useState('RIDER'); // 'RIDER' or 'PROVIDER'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getChargeLink = user ? (user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard') : '/register';
  const provideChargeLink = user ? (user.role === 'PROVIDER' ? '/provider/dashboard' : '/rider/dashboard') : '/register-provider';

  // Automatically cycle through the 3 workflow steps every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const workflowSteps = [
    {
      step: "01",
      title: "One-Tap Location Request",
      desc: "Open VOLNXT, hit 'Request a Charge', and our smart dispatch automatically locates your vehicle coordinates with sub-meter GPS accuracy."
    },
    {
      step: "02",
      title: "Proximity Smart Matching",
      desc: "We match you with the closest mobile charger van or community charging station, complete with estimated arrival, live tracking, and fixed upfront pricing."
    },
    {
      step: "03",
      title: "Fast Plug-In & Seamless Payout",
      desc: "Plug in the certified CCS or Type 2 connector. Monitor real-time battery gain on your phone, unplug, and hit the road with zero payment hassle."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
      
      {/* Modern Sticky Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-6">
            <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-black">
              VOLNXT
            </Link>

            <button
              type="button"
              onClick={() => setShowHowToUse(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200/90 px-2.5 sm:px-3.5 py-1.5 rounded-full transition shadow-sm border border-gray-200/60"
            >
              <HelpCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              <span>How to Use</span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link 
                  to={user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard'} 
                  className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-full font-bold transition text-xs shadow-md"
                >
                  Dashboard ({user.name?.split(' ')[0]})
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-gray-500 hover:text-black text-xs font-semibold px-2 py-1 transition"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-black font-semibold hover:text-gray-600 transition text-xs px-2.5 py-1.5">
                  Log in
                </Link>
                <Link 
                  to="/register-provider" 
                  className="inline-flex items-center gap-1.5 border border-gray-300 hover:border-black text-black px-3.5 py-1.5 rounded-full font-bold transition text-xs"
                >
                  <Zap className="h-3.5 w-3.5 text-emerald-600" /> Host Charger
                </Link>
                <Link 
                  to="/register" 
                  className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-full font-bold transition text-xs shadow-md"
                >
                  Get a Charge
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Hamburger Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="p-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition border border-gray-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 overflow-hidden text-left shadow-lg"
            >
              {user ? (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Signed in as</div>
                    <div className="text-sm font-bold text-black">{user.name} ({user.role})</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={user.role === 'RIDER' ? '/rider/dashboard' : '/provider/dashboard'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-200 transition"
                      title="Log out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Prominent Get a Charge & Account Actions for Guests */
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-gray-50 to-cyan-50 rounded-2xl border border-emerald-100 space-y-2.5">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Instant Mobile EV Charging
                  </div>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-black hover:bg-gray-900 text-white text-center py-2.5 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Car className="h-4 w-4 text-emerald-400" />
                    <span>Get a Charge (Sign Up)</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Link>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register-provider"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2 px-3 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 transition shadow-sm flex items-center justify-center gap-1"
                    >
                      <Zap className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Host Charger</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Options List */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowHowToUse(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-800 transition text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-emerald-600" />
                    <span>How to Use Guide</span>
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    తెలుగు / हिन्दी / EN
                  </span>
                </button>

                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-800 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Car className="h-4 w-4 text-black" />
                    <span>Get a Charge (Rider Sign Up)</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  to="/register-provider"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-800 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    <span>Host Charger & Earn (Provider Sign Up)</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  to="/how-to-use"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-800 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span>Full Screen Documentation</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                {!user ? (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-xs font-bold text-black transition"
                  >
                    <span>Log In to Your Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </span>
                  </button>
                )}
              </div>

              {/* 24/7 Helpline */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  24/7 Emergency Support
                </span>
                <span className="font-bold text-black">1800-VOLNXT</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3.5 py-1 rounded-full text-[11px] font-semibold text-gray-700 mb-4"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              On-Demand Mobile EV Charging Grid
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-black tracking-tight leading-[1.12] text-black mb-4"
            >
              Power on demand. <br />
              <span className="bg-gradient-to-r from-black via-gray-800 to-gray-500 bg-clip-text text-transparent">
                Anywhere you drive.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-gray-600 mb-6 max-w-lg font-normal leading-relaxed"
            >
              Never worry about low battery again. Request a high-speed mobile charging unit to your exact location or plug into thousands of verified neighborhood charging hosts.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <Link 
                to={getChargeLink} 
                className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-gray-900 shadow-md hover:shadow-lg transition duration-200"
              >
                <span>Request a Charge</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to={provideChargeLink} 
                className="flex items-center justify-center gap-2 bg-gray-100 text-black px-6 py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-gray-200 transition duration-200 border border-gray-200"
              >
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Host Charger & Earn</span>
              </Link>
            </motion.div>

            {/* Trust Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 pt-3 border-t border-gray-100"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-black font-extrabold text-[11px] sm:text-xs ml-0.5">4.9/5</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5">Verified Ratings</div>
              </div>
              <div className="hidden sm:block h-7 w-px bg-gray-200" />
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-black">&lt; 15 Mins</div>
                <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5">Average Arrival</div>
              </div>
              <div className="hidden sm:block h-7 w-px bg-gray-200" />
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-black">100% Safe</div>
                <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5">Certified Grid</div>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Video Card (EV Charging Workflow Footage) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6 relative"
          >
            <VideoPlayerCard
              src="https://res.cloudinary.com/de9ieldap/video/upload/v1794907583/clean_gemini_generated_video_2720adca.mp4"
              secondarySrc="https://assets.mixkit.co/videos/preview/mixkit-hands-connecting-an-electric-car-to-a-charging-station-43758-large.mp4"
              fallbackPoster="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80"
              badgeText="Active Mobile Dispatch"
              title="Autonomous Mobile EV Fast-Charging"
              subtitle="On-demand mobile roadside units and verified neighborhood charging hubs."
              hudElement={
                <div className="bg-black/85 backdrop-blur-xl border border-white/20 p-3.5 rounded-2xl text-left text-white shadow-2xl w-60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Nearest Unit</span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">0.8 km</span>
                  </div>
                  <div className="text-xs font-bold text-white mb-1.5">Mobile Van #402 (50 kW CCS2)</div>
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-4/5 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1.5 flex justify-between font-mono">
                    <span>Target: 80%</span>
                    <span>~12 min arrival</span>
                  </div>
                </div>
              }
              aspectRatio="aspect-[4/3] sm:aspect-[16/11]"
            />

            {/* Floating Mini Experience Card */}
            <div className="absolute -bottom-5 -left-5 bg-white p-3.5 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center gap-3 text-left">
              <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                <Zap className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Fast Delivery</div>
                <div className="text-xs font-bold text-black">High Power CCS & Type 2</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Stats Ribbon */}
      <section className="bg-neutral-900 text-white py-10 border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">15 min</div>
            <div className="text-xs text-gray-400 font-medium">Average Response Time</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">50+ kW</div>
            <div className="text-xs text-gray-400 font-medium">Fast Charging Power</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">99.8%</div>
            <div className="text-xs text-gray-400 font-medium">Grid Uptime & Reliability</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">24/7</div>
            <div className="text-xs text-gray-400 font-medium">Emergency Assistance</div>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works & Live Interactive Workflow Animation */}
      <section id="how-it-works" className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Effortless Mobility
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black mt-2.5 mb-2">
            How VOLNXT Powers Your Journey
          </h2>
          <p className="text-gray-600 text-sm">
            Three simple steps to seamless, anxiety-free electric vehicle driving.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Steps List (Interactive Selectable with Progress Bar) */}
          <div className="lg:col-span-6 space-y-4 text-left">
            {workflowSteps.map((item, index) => {
              const isActive = activeStep === index;
              return (
                <div 
                  key={index} 
                  onClick={() => {
                    setActiveStep(index);
                    setIsAutoPlaying(false);
                  }}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isActive 
                      ? 'border-black bg-gray-50/90 shadow-md ring-1 ring-black/10' 
                      : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50/40'
                  }`}
                >
                  {/* Progress Line on active card */}
                  {isActive && isAutoPlaying && (
                    <motion.div 
                      key={`progress-${index}`}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4.5, ease: "linear" }}
                      className="absolute top-0 left-0 h-1 bg-black"
                    />
                  )}

                  <div className="flex gap-4 items-start">
                    <div className={`text-base font-black h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive 
                        ? 'bg-black text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-black mb-1 flex items-center gap-2">
                        <span>{item.title}</span>
                        {isActive && (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-1 text-[11px] text-gray-500 font-medium flex items-center justify-between px-2">
              <span>Click any step to inspect its live workflow animation</span>
              <button 
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="text-black font-bold hover:underline flex items-center gap-1"
              >
                {isAutoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isAutoPlaying ? "Pause Auto-Cycle" : "Resume Auto-Cycle"}
              </button>
            </div>
          </div>

          {/* Right Workflow Animation Display Stage */}
          <div className="lg:col-span-6">
            <WorkflowAnimationStage 
              activeStep={activeStep}
              isPlaying={isAutoPlaying}
              onTogglePlay={() => setIsAutoPlaying(!isAutoPlaying)}
              onSelectStep={(idx) => {
                setActiveStep(idx);
                setIsAutoPlaying(false);
              }}
            />
          </div>
        </div>
      </section>

      {/* Section 3: Provider Monetization */}
      <section id="providers" className="py-16 md:py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Visual Card: High-Definition Video or Image (No amount display) */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <VideoPlayerCard
                src="https://res.cloudinary.com/de9ieldap/video/upload/v1794907583/clean_gemini_generated_video_2720adca.mp4"
                imageSrc="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1400&q=80"
                fallbackPoster="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1400&q=80"
                badgeText="Host Network"
                title="Decentralized Energy Network"
                subtitle="Join commercial stations and private homeowners hosting community chargers."
                aspectRatio="aspect-[4/3] sm:aspect-[16/11]"
                defaultMode="video"
                allowToggle={true}
              />
            </div>

            {/* Provider Copy */}
            <div className="lg:col-span-6 order-1 lg:order-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-black bg-white px-3 py-1 rounded-full border border-gray-300 shadow-sm">
                Monetize Your EV Setup
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black mt-2.5 mb-4">
                Turn your charger into passive monthly income.
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                Got a private home charger, commercial parking lot, or mobile generator? Register as a VOLNXT Provider Partner. Set your own per-kWh rates, specify available hours, and accept verified charging requests from nearby riders.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  "100% control over hours and price",
                  "Automated instant earnings payout",
                  "GPS pin visible to nearby riders",
                  "Complete safety & insurance protection"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <Link 
                to="/register-provider" 
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-gray-900 shadow-md transition"
              >
                <span>Register as Provider</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="text-2xl font-black text-black mb-4">
                VOLNXT
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                India's decentralized on-demand mobile EV charging network. Never get stranded again.
              </p>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Operational & Receiving Requests
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-black mb-4">For Riders</h4>
              <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
                <li><Link to="/register" className="hover:text-black">Request a Charge</Link></li>
                <li><Link to="/login" className="hover:text-black">Rider Sign In</Link></li>
                <li><Link to="/how-to-use" className="hover:text-black text-emerald-600 font-bold">How to Use (తెలుగు / हिन्दी / English)</Link></li>
                <li><a href="#how-it-works" className="hover:text-black">Supported EV Models</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-black mb-4">For Providers</h4>
              <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
                <li><Link to="/register-provider" className="hover:text-black">Host a Charger</Link></li>
                <li><Link to="/login" className="hover:text-black">Provider Portal</Link></li>
                <li><a href="#providers" className="hover:text-black">Earnings Calculator</a></li>
                <li><a href="#providers" className="hover:text-black">Safety Compliance</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-black mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
                <li><a href="#" className="hover:text-black">About VOLNXT</a></li>
                <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black">24/7 Roadside Hotline</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
            <div>
              © 2026 VOLNXT Technologies Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black transition">Privacy</a>
              <a href="#" className="hover:text-black transition">Terms</a>
              <a href="#" className="hover:text-black transition">Security</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Multilingual "How to Use" Modal */}
      <HowToUseModal
        isOpen={showHowToUse}
        onClose={() => setShowHowToUse(false)}
        defaultTab={howToUseTab}
        user={user}
      />
    </div>
  );
};

export default Home;
