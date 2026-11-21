import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { ArrowRight, ArrowLeft, Upload, Zap, ShieldCheck, Car, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';
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

const RegisterRider = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Personal/Identity, 2: Vehicle, 3: Charging
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
    aadharNumber: '', profilePhoto: '',
    vehicleType: 'Car', brand: '', vehicleModel: '', variant: '', registrationNumber: '', batteryCapacity: '', currentBatteryPercentage: '',
    connectorType: 'Type 2', chargingStandard: 'CCS', supportedChargingType: 'AC/DC', maxChargingPower: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.aadharNumber) {
        return setError('Please fill all required personal details');
      }
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match');
      }
    }
    if (step === 2) {
      if (!formData.brand || !formData.vehicleModel || !formData.registrationNumber || !formData.batteryCapacity || !formData.currentBatteryPercentage) {
        return setError('Please fill all required vehicle details');
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 3) return;
    if (!formData.maxChargingPower) return setError('Please enter max charging power');

    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'RIDER',
        aadharNumber: formData.aadharNumber,
        profilePhoto: formData.profilePhoto || 'mock-url.jpg',
        vehicle: {
          vehicleType: formData.vehicleType,
          brand: formData.brand,
          vehicleModel: formData.vehicleModel,
          variant: formData.variant,
          registrationNumber: formData.registrationNumber,
          batteryCapacity: Number(formData.batteryCapacity),
          currentBatteryPercentage: Number(formData.currentBatteryPercentage),
          connectorType: formData.connectorType,
          chargingStandard: formData.chargingStandard,
          supportedChargingType: formData.supportedChargingType,
          maxChargingPower: Number(formData.maxChargingPower)
        }
      });
      // Redirect to login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-black selection:text-white">
      
      {/* Left Column: Multi-Step Registration Form */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10 bg-white overflow-y-auto">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="text-2xl font-black tracking-tight text-black hover:opacity-80 transition">
              VOLNXT
            </Link>
            <div className="flex items-center gap-2">
              <Link 
                to="/how-to-use" 
                className="text-xs font-bold text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition"
              >
                How to Use
              </Link>
              <span className="bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-full">
                Rider Account
              </span>
            </div>
          </div>

          <div className="max-w-md mx-auto lg:mx-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-1">
              Join the VOLNXT Grid
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mb-5">
              Step {step} of 3 • {step === 1 ? 'Personal & Identity' : step === 2 ? 'EV Specifications' : 'Charging Protocols'}
            </p>

            {/* Tab switch between Rider and Provider registration */}
            <div className="flex border-b border-gray-200 mb-6 text-xs sm:text-sm font-semibold">
              <div className="flex-1 py-2 text-center text-black border-b-2 border-black font-bold">
                EV Rider Sign Up
              </div>
              <Link 
                to="/register-provider" 
                className="flex-1 py-2 text-center text-gray-400 hover:text-black transition-colors border-b-2 border-transparent"
              >
                Host Provider Sign Up
              </Link>
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
                
                {/* STEP 1: PERSONAL & IDENTITY */}
                {step === 1 && (
                  <motion.div 
                    key="step1" 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <InputField label="Full Name" name="name" placeholder="e.g. Aditi Sharma" value={formData.name} onChange={handleChange} />
                    <InputField label="Email Address" name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
                    <InputField label="Mobile Number" name="phone" type="tel" placeholder="e.g. 9876543210" value={formData.phone} onChange={handleChange} />
                    
                    <div className="my-5 border-t border-gray-100 pt-5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">Identity Verification</h3>
                      <InputField label="Aadhar Card Number" name="aadharNumber" placeholder="XXXX XXXX XXXX" value={formData.aadharNumber} onChange={handleChange} />
                      
                      <div className="mb-4 text-left">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                          Profile Photo <span className="text-red-500">*</span>
                        </label>
                        <label className="mt-1 flex justify-center px-4 py-3 border-2 border-gray-200 border-dashed rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-6 w-6 text-gray-400" />
                            <div className="flex text-xs text-gray-600 justify-center">
                              <span className="font-semibold text-black">{formData.profilePhoto ? 'Photo Uploaded' : 'Upload photo'}</span>
                            </div>
                            <p className="text-[10px] text-gray-500">PNG or JPG up to 5MB</p>
                          </div>
                          <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => setFormData({...formData, profilePhoto: e.target.files[0]?.name})} />
                        </label>
                      </div>
                    </div>

                    <div className="my-5 border-t border-gray-100 pt-5">
                      <InputField label="Password" name="password" type="password" placeholder="Create strong password" value={formData.password} onChange={handleChange} />
                      <InputField label="Confirm Password" name="confirmPassword" type="password" placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: VEHICLE DETAILS */}
                {step === 2 && (
                  <motion.div 
                    key="step2" 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="mb-4 text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Vehicle Type <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="vehicleType" 
                        value={formData.vehicleType} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
                      >
                        <option value="Car">Car</option>
                        <option value="Bike/Scooty">Bike / Scooter</option>
                        <option value="Auto">Auto Rickshaw</option>
                      </select>
                    </div>

                    <InputField label="Manufacturer / Brand" name="brand" placeholder="e.g. Tata, MG, Ather, Hyundai" value={formData.brand} onChange={handleChange} />
                    <InputField label="Vehicle Model" name="vehicleModel" placeholder="e.g. Nexon EV, ZS EV" value={formData.vehicleModel} onChange={handleChange} />
                    <InputField label="Variant (Optional)" name="variant" required={false} placeholder="e.g. Max / Long Range" value={formData.variant} onChange={handleChange} />
                    <InputField label="Registration Number" name="registrationNumber" placeholder="e.g. MH 01 AB 1234" value={formData.registrationNumber} onChange={handleChange} />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Battery Capacity (kWh)" name="batteryCapacity" type="number" placeholder="e.g. 40.5" value={formData.batteryCapacity} onChange={handleChange} />
                      <InputField label="Current Battery (%)" name="currentBatteryPercentage" type="number" max="100" placeholder="e.g. 24" value={formData.currentBatteryPercentage} onChange={handleChange} />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: CHARGING COMPATIBILITY */}
                {step === 3 && (
                  <motion.div 
                    key="step3" 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                  >
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
                        <option value="Type 2">Type 2 (Mennekes)</option>
                        <option value="CCS">CCS (Combined Charging System)</option>
                        <option value="CHAdeMO">CHAdeMO</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Charging Standard <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="chargingStandard" 
                        value={formData.chargingStandard} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
                      >
                        <option value="CCS">CCS</option>
                        <option value="GB/T">GB/T</option>
                        <option value="Tesla">Tesla</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Supported Charging Type <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="supportedChargingType" 
                        value={formData.supportedChargingType} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
                      >
                        <option value="AC/DC">AC and DC Fast</option>
                        <option value="DC">DC Fast Only</option>
                        <option value="AC">AC Only (Slow)</option>
                      </select>
                    </div>

                    <InputField label="Max Charging Power (kW)" name="maxChargingPower" type="number" placeholder="e.g. 50" value={formData.maxChargingPower} onChange={handleChange} />
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
                    {loading ? 'Creating Account...' : 'Complete Rider Registration'}
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
          © 2026 VOLNXT Technologies. Zero-anxiety electric mobility.
        </div>
      </div>

      {/* Right Column: Dynamic Visual Hero Panel (Image + Step Telemetry) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-neutral-950 overflow-hidden items-end p-12 lg:p-16">
        
        {/* Cinematic EV Station Image */}
        <img
          src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80"
          alt="VOLNXT High-Speed Electric Vehicle Charging Network"
          className="absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-1000 scale-105 hover:scale-100"
        />

        {/* Gradient Overlay for high-contrast typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />

        {/* Top-right Status Pill */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
          <div className="backdrop-blur-md bg-black/60 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Rider Grid • Active Dispatch</span>
          </div>
        </div>

        {/* Floating Context Card over Image based on Active Step */}
        <div className="relative z-10 max-w-lg text-left text-white">
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-4">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            {step === 1 && "Step 01 • Rider Identity & Account Security"}
            {step === 2 && "Step 02 • Intelligent Vehicle Calibration"}
            {step === 3 && "Step 03 • Fast Plug-In Protocols"}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 leading-snug">
            {step === 1 && "Your passport to limitless electric driving."}
            {step === 2 && "Precision matching tailored to your EV model."}
            {step === 3 && "High-speed power delivered directly to you."}
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 font-normal">
            {step === 1 && "Join over 50,000 EV drivers who never fear low battery. Guaranteed emergency roadside dispatch in under 15 minutes."}
            {step === 2 && "Whether you drive a Tata, MG, Ather, or luxury EV, our dispatch network calibrates exact charging curves and connector compatibility."}
            {step === 3 && "Access verified high-output 50 kW mobile charging vans and neighborhood community hosts with fixed upfront tariffs."}
          </p>

          {/* Quick Features Strip */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold text-white">GPS Dispatch</div>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <Zap className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold text-white">50 kW DC Fast</div>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold text-white">Safe & Insured</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RegisterRider;
