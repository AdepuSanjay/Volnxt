import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { ArrowRight, ArrowLeft, MapPin, Zap, CheckCircle2, ShieldCheck, Navigation, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InputField = ({ label, name, type = 'text', required = true, value, onChange, placeholder, ...props }) => (
  <div className="mb-4 text-left">
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm font-medium"
      {...props}
    />
  </div>
);

const RegisterProvider = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Personal & Business, 2: Location, 3: Charger & Pricing
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    providerType: 'INDIVIDUAL',
    businessName: '',
    address: '',
    latitude: '',
    longitude: '',
    chargingType: 'AC and DC Fast',
    connectorType: 'CCS',
    chargingPower: '50',
    pricingModel: 'PER_KWH',
    price: '15',
    minimumCharge: '0',
    startTime: '08:00 AM',
    endTime: '10:00 PM',
    safetyDeclaration: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Detect GPS Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: prev.address || `GPS Location (${lat}, ${lng})`
        }));
        setLocationSuccess(true);
        setLocating(false);
      },
      (err) => {
        console.error('Location error:', err);
        setError('Could not fetch GPS location. Please allow location permissions or enter coordinates manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Quick preset helper for instant testing
  const handleApplyPresetLocation = (lat, lng, address) => {
    setFormData(prev => ({
      ...prev,
      latitude: String(lat),
      longitude: String(lng),
      address
    }));
    setLocationSuccess(true);
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
        return setError('Please fill all required personal details');
      }
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match');
      }
    }
    if (step === 2) {
      if (!formData.address || !formData.latitude || !formData.longitude) {
        return setError('Please provide station address and location coordinates (use Detect GPS or enter manually)');
      }
      if (isNaN(Number(formData.latitude)) || isNaN(Number(formData.longitude))) {
        return setError('Latitude and Longitude must be valid numbers');
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 3) return;

    if (!formData.price || !formData.chargingPower) {
      return setError('Please enter price and max charging power');
    }

    if (!formData.safetyDeclaration) {
      return setError('You must agree to the safety declaration to register as a provider');
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/api/providers/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'PROVIDER',
        providerProfile: {
          providerType: formData.providerType,
          businessName: formData.businessName || formData.name,
          ownerName: formData.name,
          phone: formData.phone,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          chargingType: formData.chargingType,
          connectorType: formData.connectorType,
          chargingPower: `${formData.chargingPower} kW`,
          pricingModel: formData.pricingModel,
          price: parseFloat(formData.price),
          minimumCharge: parseFloat(formData.minimumCharge || 0),
          startTime: formData.startTime,
          endTime: formData.endTime,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          verificationStatus: 'APPROVED',
          safetyDeclaration: Boolean(formData.safetyDeclaration),
          isOnline: true,
          isAvailable: true
        }
      });

      // Redirect to login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Provider registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-black selection:text-white">
      
      {/* Left Column: Multi-Step Registration Form */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-4 sm:p-10 lg:p-14 z-10 bg-white overflow-y-auto">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-black hover:opacity-80 transition">
              VOLNXT
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link 
                to="/how-to-use" 
                className="text-[11px] sm:text-xs font-bold text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-2 sm:px-2.5 py-1 rounded-full transition"
              >
                How to Use
              </Link>
              <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-full">
                Host
              </span>
            </div>
          </div>

          <div className="max-w-md mx-auto lg:mx-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-1">
              Host an EV Charger
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mb-5">
              Step {step} of 3 • {step === 1 ? 'Owner & Account' : step === 2 ? 'Station Location' : 'Equipment & Pricing'}
            </p>

            {/* Tab switch between Rider and Provider registration */}
            <div className="flex border-b border-gray-200 mb-6 text-xs sm:text-sm font-semibold">
              <Link 
                to="/register" 
                className="flex-1 py-2 text-center text-gray-400 hover:text-black transition-colors border-b-2 border-transparent"
              >
                EV Rider Sign Up
              </Link>
              <div className="flex-1 py-2 text-center text-black border-b-2 border-black font-bold">
                Host Provider Sign Up
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-700 p-3.5 mb-5 text-xs sm:text-sm font-semibold border-l-4 border-red-600 rounded-r-lg flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <AnimatePresence mode="wait">
                
                {/* STEP 1: PERSONAL & BUSINESS DETAILS */}
                {step === 1 && (
                  <motion.div 
                    key="step1" 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="mb-4 text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Provider Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, providerType: 'INDIVIDUAL' })}
                          className={`py-2.5 px-3 border text-xs font-bold text-center rounded-xl transition-all ${
                            formData.providerType === 'INDIVIDUAL'
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Individual / Home
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, providerType: 'BUSINESS' })}
                          className={`py-2.5 px-3 border text-xs font-bold text-center rounded-xl transition-all ${
                            formData.providerType === 'BUSINESS'
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Business / Station
                        </button>
                      </div>
                    </div>

                    <InputField 
                      label="Owner / Contact Name" 
                      name="name" 
                      placeholder="e.g. Rahul Sharma" 
                      value={formData.name} 
                      onChange={handleChange} 
                    />

                    <InputField 
                      label="Station / Business Name" 
                      name="businessName" 
                      placeholder={formData.providerType === 'INDIVIDUAL' ? "e.g. Rahul's Home EV Charger" : "e.g. GreenPower Station"} 
                      value={formData.businessName} 
                      onChange={handleChange} 
                    />

                    <InputField 
                      label="Email Address" 
                      name="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={formData.email} 
                      onChange={handleChange} 
                    />

                    <InputField 
                      label="Mobile Number" 
                      name="phone" 
                      type="tel" 
                      placeholder="e.g. 9876543210" 
                      value={formData.phone} 
                      onChange={handleChange} 
                    />

                    <div className="my-5 border-t border-gray-100 pt-5">
                      <InputField 
                        label="Password" 
                        name="password" 
                        type="password" 
                        placeholder="Create strong password" 
                        value={formData.password} 
                        onChange={handleChange} 
                      />
                      <InputField 
                        label="Confirm Password" 
                        name="confirmPassword" 
                        type="password" 
                        placeholder="Repeat password" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: STATION LOCATION & GPS */}
                {step === 2 && (
                  <motion.div 
                    key="step2" 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-base font-bold text-black">Charging Station Location</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 font-medium">
                      Nearby riders using 'Get a Charge' will see your station sorted by distance.
                    </p>

                    {/* GPS Detect Button */}
                    <div className="mb-4 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-black flex items-center gap-1.5">
                          <Navigation className="h-3.5 w-3.5 text-emerald-600" /> Device GPS
                        </span>
                        {locationSuccess && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Coordinates Locked
                          </span>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={locating}
                        className="w-full bg-black text-white hover:bg-gray-900 py-2.5 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {locating ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Detecting GPS...
                          </>
                        ) : (
                          <>
                            <Navigation className="h-3.5 w-3.5" />
                            Detect My Station Location
                          </>
                        )}
                      </button>

                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span>Presets:</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetLocation(12.9716, 77.5946, 'MG Road, Bengaluru, Karnataka')}
                          className="text-black font-semibold hover:underline"
                        >
                          Bengaluru
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetLocation(19.0760, 72.8777, 'Bandra Kurla Complex, Mumbai')}
                          className="text-black font-semibold hover:underline"
                        >
                          Mumbai
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetLocation(28.6139, 77.2090, 'Connaught Place, New Delhi')}
                          className="text-black font-semibold hover:underline"
                        >
                          Delhi
                        </button>
                      </div>
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Full Station Address / Landmark <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="address"
                        rows="2"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Building, Street, Landmark, City, Pincode"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-xs font-medium resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InputField 
                        label="Latitude" 
                        name="latitude" 
                        type="number" 
                        step="any" 
                        placeholder="e.g. 12.9716" 
                        value={formData.latitude} 
                        onChange={handleChange} 
                      />
                      <InputField 
                        label="Longitude" 
                        name="longitude" 
                        type="number" 
                        step="any" 
                        placeholder="e.g. 77.5946" 
                        value={formData.longitude} 
                        onChange={handleChange} 
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: EQUIPMENT SPECIFICATIONS & PRICING */}
                {step === 3 && (
                  <motion.div 
                    key="step3" 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-base font-bold text-black">Charger Specifications</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 font-medium">
                      Configure your available hardware plug types and pricing tariffs.
                    </p>

                    <div className="mb-4 text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Connector Type <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="connectorType" 
                        value={formData.connectorType} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
                      >
                        <option value="CCS">CCS (Combined Charging System)</option>
                        <option value="Type 2">Type 2 (Mennekes)</option>
                        <option value="CHAdeMO">CHAdeMO</option>
                        <option value="GB/T">GB/T</option>
                        <option value="15A Socket">15A 3-Pin Socket</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Supported Charging Type <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="chargingType" 
                        value={formData.chargingType} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
                      >
                        <option value="AC and DC Fast">AC and DC Fast</option>
                        <option value="DC">DC Fast Only</option>
                        <option value="AC">AC Only (Normal / Slow)</option>
                      </select>
                    </div>

                    <InputField 
                      label="Max Charging Power (kW)" 
                      name="chargingPower" 
                      type="number" 
                      placeholder="e.g. 50" 
                      value={formData.chargingPower} 
                      onChange={handleChange} 
                    />

                    <div className="my-4 border-t border-gray-100 pt-4">
                      <div className="mb-4 text-left">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                          Pricing Model <span className="text-red-500">*</span>
                        </label>
                        <select 
                          name="pricingModel" 
                          value={formData.pricingModel} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
                        >
                          <option value="PER_KWH">Per kWh (Recommended)</option>
                          <option value="PER_PERCENTAGE">Per 1% Battery Gain</option>
                          <option value="FIXED">Fixed Flat Rate Per Session</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField 
                          label={formData.pricingModel === 'PER_KWH' ? "Rate (₹ / kWh)" : formData.pricingModel === 'PER_PERCENTAGE' ? "Rate (₹ / %)" : "Flat Rate (₹)"} 
                          name="price" 
                          type="number" 
                          placeholder="e.g. 15" 
                          value={formData.price} 
                          onChange={handleChange} 
                        />
                        <InputField 
                          label="Min Charge (₹)" 
                          name="minimumCharge" 
                          type="number" 
                          required={false}
                          placeholder="0" 
                          value={formData.minimumCharge} 
                          onChange={handleChange} 
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mt-4 text-left">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          name="safetyDeclaration"
                          checked={formData.safetyDeclaration}
                          onChange={handleChange}
                          className="mt-0.5 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="text-[11px] text-gray-700 font-medium leading-tight">
                          I declare that my charging equipment, grounding, and wiring comply with electrical safety standards.
                        </span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Actions */}
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button 
                    type="button" 
                    onClick={handleBack} 
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-black rounded-xl font-semibold flex items-center justify-center transition flex-shrink-0"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                {step < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="flex-1 h-12 bg-black hover:bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center transition text-sm shadow-md"
                  >
                    Next Step <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 h-12 bg-black hover:bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center transition text-sm shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Registering Provider...' : 'Complete Provider Registration'}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          © 2026 VOLNXT Technologies. Monetize your EV charging setup.
        </div>
      </div>

      {/* Right Column: Dynamic Visual Hero Panel (Image + Host Telemetry) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-neutral-950 overflow-hidden items-end p-12 lg:p-16">
        
        {/* Cinematic Host EV Station Image */}
        <img
          src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=80"
          alt="VOLNXT Decentralized Community EV Charging Network"
          className="absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-1000 scale-105 hover:scale-100"
        />

        {/* Gradient Overlay for high-contrast typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />

        {/* Top-right Status Pill */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
          <div className="backdrop-blur-md bg-black/60 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Host Network • Instant Payouts</span>
          </div>
        </div>

        {/* Floating Context Card over Image based on Active Step */}
        <div className="relative z-10 max-w-lg text-left text-white">
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-4">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            {step === 1 && "Step 01 • Host Partner Verification"}
            {step === 2 && "Step 02 • High-Precision Station Pinning"}
            {step === 3 && "Step 03 • Autonomous Tariff Dispatch"}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 leading-snug">
            {step === 1 && "Transform your charger into a recurring revenue stream."}
            {step === 2 && "Connected directly to thousands of nearby EV drivers."}
            {step === 3 && "Automated session billing with instant bank payouts."}
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 font-normal">
            {step === 1 && "Whether you own a private home wallbox, an apartment parking socket, or a commercial station, VOLNXT turns your electrical outlet into an active business."}
            {step === 2 && "Your station coordinates are instantly matched when drivers tap 'Request a Charge', guiding visiting drivers with GPS turn-by-turn navigation."}
            {step === 3 && "Retain full control over your per-kWh tariffs, operating hours, and accepted connector standards with zero manual billing headaches."}
          </p>

          {/* Quick Host Benefits Strip */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 flex-shrink-0 text-center font-bold leading-4 text-emerald-400">₹</span>
              <div className="text-xs font-bold text-white">Instant Payouts</div>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <Clock className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold text-white">Custom Hours</div>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold text-white">Host Protection</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RegisterProvider;
