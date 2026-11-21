import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Mail, KeyRound, Lock, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP verification, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Trigger OTP Request
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message || 'Verification code dispatched to your Gmail');
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setStep(2);
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not dispatch reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage('A new verification code has been dispatched to your Gmail.');
      if (res.data.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(45);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Verify OTP step
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      return setError('Please enter the 6-digit verification code');
    }
    setError('');
    setStep(3);
  };

  // Submit New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword
      });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Code may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col lg:flex-row font-sans selection:bg-black selection:text-white">
      
      {/* Left Column: Flow Container */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white border-r border-gray-100 z-10">
        <div>
          {/* Top Brand Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <Link to="/" className="text-2xl font-black tracking-tight text-black flex items-center gap-2">
              VOLNXT
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-black transition"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>

          <div className="max-w-md mx-auto lg:mx-0">
            
            {/* Step Progress Pill */}
            {step < 4 && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Account Recovery
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  Step {step} of 3
                </span>
              </div>
            )}

            {/* Notifications */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-700 p-3.5 mb-5 text-xs sm:text-sm font-semibold border-l-4 border-red-600 rounded-r-xl flex items-start gap-2 shadow-sm"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {message && step === 2 && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 text-emerald-800 p-3.5 mb-5 text-xs sm:text-sm font-semibold border-l-4 border-emerald-600 rounded-r-xl flex items-start gap-2 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p>{message}</p>
                  {devOtp && (
                    <p className="mt-1 font-mono text-xs text-emerald-900 bg-emerald-100/70 p-1 rounded inline-block">
                      Local Testing Code: <strong>{devOtp}</strong>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              
              {/* STEP 1: ENTER GMAIL */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-2">
                    Reset your password
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6">
                    Enter the Gmail or registered email address associated with your VOLNXT account. We'll send a 6-digit confirmation code.
                  </p>

                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Registered Email / Gmail Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-medium transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-bold text-sm rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: ENTER OTP */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-2">
                    Enter verification code
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6">
                    We sent a 6-digit one-time password to <strong className="text-black font-semibold">{email}</strong>. Enter it below to proceed:
                  </p>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        6-Digit Security Code
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          autoFocus
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-lg font-mono font-bold tracking-widest transition text-center"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={otp.length !== 6}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-bold text-sm rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-40"
                    >
                      <span>Verify Code</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  <div className="mt-6 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="hover:text-black hover:underline"
                    >
                      Change email
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || loading}
                      className={`flex items-center gap-1 font-bold ${
                        resendCooldown > 0 ? 'text-gray-400' : 'text-emerald-700 hover:underline'
                      }`}
                    >
                      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                >
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-2">
                    Create new password
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6">
                    Choose a strong, unique password with at least 6 characters for your VOLNXT account.
                  </p>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-black"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-bold text-sm rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Save & Update Password</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-left"
                >
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-2">
                    Password updated!
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6">
                    Your password has been successfully reset. You can now use your new password to access your VOLNXT account.
                  </p>

                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-bold text-sm rounded-xl transition duration-200 shadow-md"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Security Assurance */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Protected with end-to-end 256-bit encryption.</span>
        </div>
      </div>

      {/* Right Column: Dynamic Cinematic Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-neutral-950 overflow-hidden items-end p-12 lg:p-16">
        
        {/* High-Resolution EV Charging Visual */}
        <img
          src="https://images.unsplash.com/photo-1558441719-aa34ab54e84c?auto=format&fit=crop&w=1600&q=80"
          alt="VOLNXT High Security EV Network"
          className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-1000 scale-105 hover:scale-100"
        />

        {/* Contrast Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />

        {/* Top-Right Badge */}
        <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
          <div className="backdrop-blur-md bg-black/60 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gmail 2FA Active</span>
          </div>
        </div>

        {/* Floating Telemetry & Information Card */}
        <div className="relative z-10 max-w-lg text-left text-white">
          <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-4">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Decentralized Account Security
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 leading-snug">
            Zero-compromise security for your electric journey.
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 font-normal">
            Every authentication request is secured with time-limited one-time verification tokens sent directly to your registered Google inbox, preventing unauthorized station takeovers or ride requests.
          </p>

          <div className="grid grid-cols-3 gap-3 p-4 bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl">
            <div>
              <div className="text-lg font-black text-white">10 Mins</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">OTP Expiry</div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <div className="text-lg font-black text-emerald-400">256-Bit</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Bcrypt Hash</div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <div className="text-lg font-black text-white">Instant</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">SMTP Dispatch</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
