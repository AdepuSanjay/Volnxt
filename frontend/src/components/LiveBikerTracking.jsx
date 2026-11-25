import React, { useState } from 'react';
import { 
  Navigation, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Car, 
  Clock, 
  CheckCircle2, 
  Radio,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveVehicleMap from './LiveVehicleMap';

const LiveBikerTracking = ({ request, onStatusChange }) => {
  const [distanceKm, setDistanceKm] = useState(() => {
    return request.currentLat != null && request.currentLng != null
      ? Number(request.currentDistanceKm || request.distance || 0)
      : null;
  });
  const [etaMinutes, setEtaMinutes] = useState(() => {
    return request.currentLat != null && request.currentLng != null
      ? Number(request.etaMinutes || 0)
      : null;
  });
  const hasArrived = request.status === 'ARRIVED';

  const bikerName = request.bikerName || request.providerId?.name || 'Ramesh K. (Certified EV Tech)';
  const bikerPhone = request.bikerPhone || request.providerId?.phone || '+91 98450 12345';
  const bikerVehicle = request.bikerVehicle || 'VOLNXT Mobile DC Van (KA-01-EV-4421)';

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-left">
      
      {/* Top Live Dispatch Radar Banner */}
      <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-black p-5 sm:p-6 text-white relative overflow-hidden">
        {/* Animated Radar Pulse Rings in background */}
        <div className="absolute right-[-20px] top-[-20px] w-48 h-48 pointer-events-none opacity-20">
          <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping" />
          <div className="absolute inset-4 rounded-full border border-emerald-400/80 animate-pulse" />
          <div className="absolute inset-10 rounded-full border border-emerald-400/40" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {hasArrived ? "Mobile Unit Arrived" : "Live Provider Approaching"}
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {hasArrived ? "Technician Arrived at Vehicle" : "En Route to Your Location"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
              {hasArrived 
                ? "Your provider is at the pickup point and ready to connect."
                : "Live provider GPS is updating the route and arrival estimate."}
            </p>
          </div>

          {/* Live GPS status */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 self-start sm:self-auto">
            <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-gray-300 font-bold uppercase">Trip status</div>
              <div className="text-sm font-black text-white">{hasArrived ? 'Arrived' : 'Live GPS'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Ola/Rapido Street Map */}
      <div className="p-4 sm:p-6 bg-slate-50 border-b border-gray-100">
        <LiveVehicleMap 
          riderLat={request.riderLat || 12.9716}
          riderLng={request.riderLng || 77.5946}
          riderAddress={request.riderAddress || "Your EV Pickup Point"}
          providerLat={request.currentLat}
          providerLng={request.currentLng}
          providerName={bikerName}
          requestId={request._id}
          distanceKm={distanceKm}
          etaMinutes={etaMinutes}
          onRouteMetrics={(metrics) => {
            setDistanceKm(metrics?.distanceKm ?? null);
            setEtaMinutes(metrics?.etaMinutes ?? null);
          }}
          status={hasArrived ? 'ARRIVED' : request.status}
          role="RIDER"
          height="h-[340px] sm:h-[400px]"
        />

        {/* Live Dynamic Distance & ETA Meters */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-emerald-600" />
              Remaining Distance
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1">
              {hasArrived ? "0.0 km" : distanceKm != null ? `${distanceKm.toFixed(1)} km` : "Waiting for GPS"}
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Live Arrival ETA
            </div>
            <div className="break-words text-xl sm:text-3xl font-black text-emerald-600 mt-1">
              {hasArrived ? "Arrived!" : etaMinutes != null ? `~${etaMinutes} mins` : "Calculating route"}
            </div>
          </div>
        </div>
      </div>

      {/* Technician & Vehicle Dispatch Card */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
              {bikerName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="break-words font-bold text-sm sm:text-base text-black">{bikerName}</h4>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Tech
                </span>
              </div>
              <p className="break-words text-xs text-gray-600 mt-0.5 font-medium">{bikerVehicle}</p>
              <p className="break-words text-[11px] text-gray-500">Equipped with 30 kW High-Speed DC CCS2 & Type-2 Plugs</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href={`tel:${bikerPhone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              Call Tech
            </a>
          </div>
        </div>

        {/* Live Stepper Workflow */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200">
          <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Live Dispatch Steps</h5>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>1. Request Matched</span>
            </div>

            <div className={`flex items-center gap-2 p-2 rounded-lg font-bold border ${
              !hasArrived 
                ? 'bg-black text-white border-black animate-pulse shadow-sm' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {hasArrived ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <Navigation className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>2. Biker Approaching</span>
            </div>

            <div className={`flex items-center gap-2 p-2 rounded-lg font-bold border ${
              hasArrived 
                ? 'bg-black text-white border-black animate-pulse' 
                : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}>
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>3. Arrived at Vehicle</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-gray-400 font-bold border border-gray-200">
              <Zap className="h-4 w-4 flex-shrink-0" />
              <span>4. High-Speed Charge</span>
            </div>

          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium">
            {hasArrived 
              ? "Technician is now setting up the charging cable." 
              : "Distance updates every 3 seconds with GPS precision."}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {!hasArrived && (
              <button
                type="button"
                onClick={() => {
                  onStatusChange('ARRIVED');
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                I See the Charger / Arrived
              </button>
            )}

            <button
              type="button"
              onClick={() => onStatusChange('CANCELLED')}
              className="px-3 py-2.5 text-xs font-semibold text-gray-400 hover:text-red-600 transition"
            >
              Cancel Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBikerTracking;
