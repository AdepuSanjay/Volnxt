import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Battery, Zap, MapPin, Clock, LogOut, CheckCircle, Car, Search, Navigation, AlertCircle, XCircle, Phone, Mail, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveBikerTracking from '../components/LiveBikerTracking';

const RiderDashboard = () => {
  const { user, extraData, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [battery, setBattery] = useState(extraData?.currentBatteryPercentage || 15);
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); 
  
  const POPULAR_LOCATIONS = [
    { name: "Koramangala 4th Block, Bengaluru", lat: 12.9352, lng: 77.6245 },
    { name: "Indiranagar 100ft Road, Bengaluru", lat: 12.9784, lng: 77.6408 },
    { name: "Whitefield ITPL Main Rd, Bengaluru", lat: 12.9863, lng: 77.7337 },
    { name: "Hitec City Cyber Towers, Hyderabad", lat: 17.4504, lng: 78.3808 },
    { name: "Gachibowli Outer Ring Rd, Hyderabad", lat: 17.4401, lng: 78.3489 },
    { name: "Bandra Kurla Complex (BKC), Mumbai", lat: 19.0657, lng: 72.8687 },
    { name: "Connaught Place Inner Circle, Delhi", lat: 28.6315, lng: 77.2167 },
    { name: "Cyber Hub, DLF Phase 2, Gurugram", lat: 28.4986, lng: 77.0878 }
  ];

  const [locationStatus, setLocationStatus] = useState('GRANTED'); 
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [locationAddress, setLocationAddress] = useState('Koramangala 4th Block, Bengaluru (Live GPS)');
  const [locationInput, setLocationInput] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [confirmingRequest, setConfirmingRequest] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [maxRadius, setMaxRadius] = useState(50); // in km

  useEffect(() => {
    // Initial fetch of providers around default location
    fetchProviders(12.9716, 77.5946, 50);

    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const reqRes = await axios.get(`${API_BASE_URL}/api/requests/my`, { headers: { Authorization: `Bearer ${token}` } });
        const requests = reqRes.data;
        setMyRequests(requests);
        
        const active = requests.find(r => ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED'].includes(r.status));
        setActiveRequest(active || null);

        const sessionRes = await axios.get(`${API_BASE_URL}/api/charging/active`, { headers: { Authorization: `Bearer ${token}` } });
        if (sessionRes.data) {
          navigate(`/session/${sessionRes.data._id}`);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchRequests();
    const interval = setInterval(fetchRequests, 2500);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (activeRequest?.status === 'ACCEPTED' && timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [activeRequest, timeLeft]);

  const handleFindNearby = (customLat = null, customLng = null, radius = maxRadius) => {
    setLocationStatus('ASKING');
    
    if (customLat !== null && customLng !== null) {
      setLocation({ lat: customLat, lng: customLng });
      setLocationStatus('GRANTED');
      fetchProviders(customLat, customLng, radius);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          setLocationAddress(`GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setLocationStatus('GRANTED');
          await fetchProviders(lat, lng, radius);
        },
        (error) => {
          console.error("Error getting location", error);
          setLocationStatus('DENIED');
          // Fallback location: Bengaluru center or load all
          setLocation({ lat: 12.9716, lng: 77.5946 });
          setLocationAddress('Bengaluru Center (Fallback)');
          fetchProviders(12.9716, 77.5946, radius);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationStatus('DENIED');
      fetchProviders();
    }
  };

  const handleApplyPresetLocation = (lat, lng, label) => {
    setLocation({ lat, lng });
    setLocationAddress(label);
    setLocationStatus('GRANTED');
    fetchProviders(lat, lng, maxRadius);
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setConfirmingRequest(true);
  };

  const fetchProviders = async (lat = '', lng = '', radius = maxRadius) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = (lat && lng) 
        ? `${API_BASE_URL}/api/providers/nearby?lat=${lat}&lng=${lng}&radius=${radius}` 
        : `${API_BASE_URL}/api/providers/nearby?radius=${radius}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setProviders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setMaxRadius(newRadius);
    if (location) {
      fetchProviders(location.lat, location.lng, newRadius);
    } else {
      fetchProviders('', '', newRadius);
    }
  };

  const calculateEstimate = () => {
    if (!selectedProvider) return { cost: 0, total: 0, fee: 5, added: 0 };
    
    let cost = 0;
    const target = 80;
    const added = Math.max(0, target - battery);

    if (selectedProvider.pricingModel === 'PER_PERCENTAGE') {
      cost = added * selectedProvider.price;
    } else if (selectedProvider.pricingModel === 'PER_KWH') {
      const kwhAdded = (added / 100) * (extraData?.batteryCapacity || 30);
      cost = kwhAdded * selectedProvider.price;
    } else {
      cost = selectedProvider.price;
    }

    return {
      cost: Math.round(cost),
      fee: 5,
      total: Math.round(cost + 5),
      added
    };
  };

  const confirmChargingRequest = async () => {
    if (!selectedProvider) return;
    setRequestingId(selectedProvider._id);
    const est = calculateEstimate();
    const providerUserId = selectedProvider.userId?._id || selectedProvider.userId;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/requests`, {
        providerId: providerUserId,
        batteryStart: battery,
        targetBattery: 80,
        estimatedPrice: est.total,
        estimatedTime: 35,
        distance: selectedProvider.distance || 1.2,
        riderLat: location?.lat || 12.9716,
        riderLng: location?.lng || 77.5946,
        riderAddress: locationAddress || 'Current GPS Location'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConfirmingRequest(false);
      setSelectedProvider(null);
      
      const reqRes = await axios.get(`${API_BASE_URL}/api/requests/my`, { headers: { Authorization: `Bearer ${token}` } });
      setMyRequests(reqRes.data);
      const active = reqRes.data.find(r => ['PENDING', 'ACCEPTED', 'ARRIVED'].includes(r.status));
      setActiveRequest(active || null);
    } catch (error) {
      console.error(error);
      alert('Failed to send request to provider');
    } finally {
      setRequestingId(null);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeRequest) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/requests/${activeRequest._id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveRequest({ ...activeRequest, status });
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Compatibility checker
  const isCompatible = (provider) => {
    if (!extraData || !extraData.connectorType) return true;
    const vehicleConn = extraData.connectorType.toLowerCase().trim();
    const provConn = (provider.connectorType || '').toLowerCase().trim();
    return provConn.includes(vehicleConn) || vehicleConn.includes(provConn) || provConn === 'other';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-black font-black text-xl sm:text-2xl tracking-tighter">
          VOLNXT
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center text-black font-bold text-xs sm:text-base">
              {user?.name?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-black">{user?.name}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-medium truncate max-w-[120px] sm:max-w-none">
                {extraData?.brand} {extraData?.vehicleModel || 'EV Rider'}
              </div>
            </div>
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-black transition-colors font-medium text-xs sm:text-sm px-2 py-1">
            Log out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Active Journey View */}
        {activeRequest ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
            {activeRequest.status === 'PENDING' ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
                <div className="py-10">
                  <div className="inline-flex h-24 w-24 rounded-full border-4 border-gray-100 items-center justify-center mb-6 border-t-black animate-spin"></div>
                  <h2 className="text-2xl sm:text-3xl font-black text-black mb-3">Connecting to Nearby Chargers...</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm sm:text-base">
                    Dispatching request to {activeRequest.providerId?.name || 'Charging Station'}. Please wait a moment while they accept.
                  </p>
                  
                  <button 
                    onClick={() => handleUpdateStatus('CANCELLED')} 
                    className="text-gray-500 hover:text-red-600 font-bold flex items-center justify-center gap-2 mx-auto transition text-sm py-2 px-4 rounded-xl border border-gray-200 hover:border-red-200"
                  >
                    <XCircle className="h-4 w-4" /> Cancel Request
                  </button>
                </div>
              </div>
            ) : (
              <LiveBikerTracking 
                request={activeRequest} 
                onStatusChange={handleUpdateStatus} 
              />
            )}
          </motion.div>
        ) : (
          <>
            {!confirmingRequest && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                {/* Vehicle & Battery Status */}
                <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-gray-500 font-bold tracking-wider uppercase text-xs">Your EV Status</h3>
                      <div className="text-xl font-bold text-black mt-0.5">
                        {extraData?.brand} {extraData?.vehicleModel || 'Electric Vehicle'}
                      </div>
                    </div>
                    <Battery className="h-7 w-7 text-black" />
                  </div>
                  
                  <div className="flex items-baseline gap-4 my-2">
                    <div className="text-5xl font-black text-black tracking-tight">{battery}%</div>
                    <div className="text-sm text-gray-500 font-medium">
                      Est. Range: <span className="text-black font-bold">{Math.round(battery * 0.8)} km</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-semibold">
                    <span>Connector: <strong className="text-black">{extraData?.connectorType || 'CCS'}</strong></span>
                    <span>Max: <strong className="text-black">{extraData?.maxChargingPower || 50} kW</strong></span>
                  </div>
                </div>
                
                {/* Find Nearby Action */}
                <div className="bg-black p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-900 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-gray-400 font-bold tracking-wider uppercase text-xs">On-Demand Charging</h3>
                      <div className="text-xl font-bold text-white mt-0.5">Find Closest Available Providers</div>
                    </div>
                    <Zap className="h-7 w-7 text-white" />
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Locate registered EV charging points and mobile providers near your current GPS position.
                  </p>

                  <button 
                    onClick={() => handleFindNearby()}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition text-lg"
                  >
                    <Search className="h-5 w-5" />
                    Request a Charge
                  </button>
                </div>
              </motion.div>
            )}

            {/* Confirmation Screen */}
            {confirmingRequest && selectedProvider && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
                <button onClick={() => setConfirmingRequest(false)} className="text-gray-500 hover:text-black font-bold text-sm mb-6 flex items-center gap-1">
                   ← Back to Providers
                </button>
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                  <h2 className="text-3xl font-bold text-black mb-2">Confirm Charging Request</h2>
                  <p className="text-sm text-gray-500 mb-6 font-medium">Review provider location and estimated charge cost.</p>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl mb-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-2xl font-bold text-black">{selectedProvider.businessName}</div>
                        <div className="text-xs text-gray-500 font-medium mt-1">Host: {selectedProvider.ownerName || selectedProvider.userId?.name}</div>
                      </div>
                      <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {selectedProvider.distance != null ? `${selectedProvider.distance.toFixed(1)} km away` : 'Nearby'}
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 flex items-center gap-1.5 mt-2">
                      <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span>{selectedProvider.address}</span>
                    </div>

                    {(selectedProvider.phone || selectedProvider.userId?.phone) && (
                      <div className="text-sm text-gray-700 flex items-center gap-1.5 mt-1.5">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span>{selectedProvider.phone || selectedProvider.userId?.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600 font-medium">Charger Specs</span>
                      <span className="font-bold text-black">{selectedProvider.connectorType} • {selectedProvider.chargingPower}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600 font-medium">Charge amount</span>
                      <span className="font-bold text-black">{calculateEstimate().added}% battery gain</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600 font-medium">Rate</span>
                      <span className="font-bold text-black">
                        ₹{selectedProvider.price} {selectedProvider.pricingModel === 'PER_KWH' ? '/ kWh' : (selectedProvider.pricingModel === 'PER_PERCENTAGE' ? '/ %' : '/ session')}
                      </span>
                    </div>
                    <div className="flex justify-between text-base border-t border-gray-100 pt-3">
                      <span className="text-gray-600 font-medium">Estimated cost</span>
                      <span className="font-bold text-black">₹{calculateEstimate().cost}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600 font-medium">Platform fee</span>
                      <span className="font-bold text-black">₹{calculateEstimate().fee}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-black pt-4 border-t border-gray-200">
                      <span>Total estimate</span>
                      <span>₹{calculateEstimate().total}</span>
                    </div>
                  </div>

                  <button 
                    onClick={confirmChargingRequest}
                    disabled={requestingId !== null}
                    className="w-full bg-black text-white font-bold py-5 rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-xl"
                  >
                    {requestingId !== null ? 'Sending Request...' : 'Send Request to Provider'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Nearby Closest Location Providers List */}
            {!confirmingRequest && locationStatus !== 'IDLE' && (
              <div className="mt-6">
                
                {/* Ola / Rapido Style Live Location Entry & Range Selector Card */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 flex-shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pickup & EV Parking Spot</div>
                        <div className="text-sm sm:text-base font-black text-black flex items-center gap-2">
                          <span className="truncate max-w-[260px] sm:max-w-md">{locationAddress || 'Koramangala 4th Block, Bengaluru'}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            GPS Active
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFindNearby()}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
                    >
                      <Compass className="h-4 w-4 text-emerald-600 animate-spin" />
                      <span>Lock Live GPS</span>
                    </button>
                  </div>

                  {/* Ola/Rapido Style Location Search Input */}
                  <div className="relative">
                    <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 px-4 py-3 transition">
                      <Search className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" />
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => {
                          setLocationInput(e.target.value);
                          setShowLocationSuggestions(true);
                        }}
                        onFocus={() => setShowLocationSuggestions(true)}
                        placeholder="Search landmark, street, tech park or building..."
                        className="w-full bg-transparent text-xs sm:text-sm font-semibold text-black focus:outline-none placeholder-gray-400"
                      />
                      {locationInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocationInput('');
                            setShowLocationSuggestions(false);
                          }}
                          className="text-gray-400 hover:text-black p-1"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showLocationSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-gray-100">
                        <div className="p-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/90">
                          Instant EV Hubs & City Landmarks
                        </div>
                        {POPULAR_LOCATIONS
                          .filter(loc => !locationInput || loc.name.toLowerCase().includes(locationInput.toLowerCase()))
                          .map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setLocationInput(loc.name);
                                setLocationAddress(loc.name);
                                setLocation({ lat: loc.lat, lng: loc.lng });
                                setLocationStatus('GRANTED');
                                setShowLocationSuggestions(false);
                                fetchProviders(loc.lat, loc.lng, maxRadius);
                              }}
                              className="w-full px-4 py-3 text-left text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition"
                            >
                              <span className="flex items-center gap-2.5">
                                <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                <span>{loc.name}</span>
                              </span>
                              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-bold">Select</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Range Radius Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Search Proximity Radius:
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[10, 25, 50, 100].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRadiusChange(r)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            maxRadius === r
                              ? 'bg-black text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black'
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-black tracking-tight">
                      Closest Available Providers ({providers.length})
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Sorted by nearest distance to your location
                    </p>
                  </div>
                  {locationStatus === 'DENIED' && (
                    <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-amber-200">
                      <AlertCircle className="h-4 w-4"/> Using fallback location
                    </div>
                  )}
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-gray-100 rounded-3xl h-64 animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {providers.map((provider, idx) => {
                        const compatible = isCompatible(provider);
                        const isClosest = idx === 0 && provider.distance !== null;

                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            key={provider._id} 
                            className={`bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-md transition-all flex flex-col cursor-pointer relative ${
                              isClosest ? 'border-black ring-1 ring-black' : 'border-gray-200'
                            }`}
                            onClick={() => handleProviderSelect(provider)}
                          >
                            {isClosest && (
                              <div className="bg-black text-white text-[11px] font-bold px-3 py-1 flex items-center gap-1 uppercase tracking-wider">
                                <Zap className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /> Closest Available Charger
                              </div>
                            )}

                            <div className="p-7 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-bold text-xl text-black leading-tight">
                                      {provider.businessName || provider.ownerName || 'Charging Station'}
                                    </h3>
                                    <div className="text-xs text-gray-500 font-medium mt-1">
                                      {provider.providerType === 'BUSINESS' ? 'Commercial Charging Station' : 'Individual / Private Charger'}
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    {compatible ? (
                                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Compatible
                                      </span>
                                    ) : (
                                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        {provider.connectorType}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Distance & Address */}
                                <div className="space-y-1.5 my-4 bg-gray-50 p-4 rounded-xl text-xs">
                                  <div className="flex items-center gap-2 font-bold text-black text-sm">
                                    <MapPin className="h-4 w-4 text-black flex-shrink-0" />
                                    <span>
                                      {provider.distance != null ? (
                                        <span className="text-emerald-700">{provider.distance.toFixed(1)} km away</span>
                                      ) : (
                                        <span>Nearby</span>
                                      )}
                                    </span>
                                  </div>
                                  
                                  <div className="text-gray-600 pl-6 leading-relaxed line-clamp-2">
                                    {provider.address || 'Location on map'}
                                  </div>

                                  {(provider.phone || provider.userId?.phone) && (
                                    <div className="text-gray-500 pl-6 pt-1 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{provider.phone || provider.userId?.phone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Charger specs */}
                                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-gray-100">
                                  <div>
                                    <span className="text-gray-400 block font-medium">Connector & Power</span>
                                    <span className="font-bold text-black">{provider.connectorType} • {provider.chargingPower}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-gray-400 block font-medium">Rate</span>
                                    <span className="font-bold text-black">
                                      ₹{provider.price} {provider.pricingModel === 'PER_KWH' ? '/ kWh' : (provider.pricingModel === 'PER_PERCENTAGE' ? '/ %' : '/ session')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProviderSelect(provider);
                                }}
                                className="w-full mt-4 font-bold py-3.5 rounded-xl transition-colors text-base bg-black text-white hover:bg-gray-900"
                              >
                                Select & Request Charge
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {providers.length === 0 && (
                      <div className="col-span-full bg-white border border-gray-200 rounded-3xl p-12 text-center">
                        <div className="inline-flex h-16 w-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                          <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">No Charging Providers Nearby</h3>
                        <p className="text-gray-500 max-w-md mx-auto text-sm mb-6">
                          No active providers found within {maxRadius} km. Try increasing the search radius or choosing a different location.
                        </p>
                        <button
                          onClick={() => handleRadiusChange(100)}
                          className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-900 transition"
                        >
                          Expand Radius to 100 km
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default RiderDashboard;
