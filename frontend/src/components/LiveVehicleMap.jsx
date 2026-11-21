import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Zap, 
  Car, 
  Compass, 
  ExternalLink, 
  Maximize2, 
  Layers, 
  LocateFixed, 
  Radio, 
  Clock 
} from 'lucide-react';

const LiveVehicleMap = ({
  riderLat = 12.9716,
  riderLng = 77.5946,
  riderAddress = "Current EV Location",
  providerLat = 12.9866,
  providerLng = 77.6096,
  providerName = "VOLNXT Mobile Charger #402",
  riderName = "Rider's EV",
  status = "ON_THE_WAY",
  distanceKm = 1.8,
  etaMinutes = 4,
  role = "RIDER", // 'RIDER' or 'PROVIDER'
  height = "h-[360px] sm:h-[440px]"
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const baseLineRef = useRef(null);

  const [activeDistance, setActiveDistance] = useState(distanceKm);
  const [activeEta, setActiveEta] = useState(etaMinutes);
  const [currentProvPos, setCurrentProvPos] = useState({ lat: providerLat, lng: providerLng });

  const isArrived = status === 'ARRIVED' || activeDistance <= 0.1;

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // If map already initialized, re-use instance
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [riderLat, riderLng],
        zoom: 14,
        zoomControl: false
      });

      // CartoDB Voyager / OpenStreetMap clean tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Custom Rider EV Marker
    const riderHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); pointer-events: auto;">
        <div style="position: absolute; width: 48px; height: 48px; background: rgba(16, 185, 129, 0.3); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 38px; height: 38px; background: #000; border: 2.5px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(0,0,0,0.45);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div style="background: rgba(0,0,0,0.85); color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-top: 4px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          ${role === 'RIDER' ? 'Your EV Pickup' : riderName}
        </div>
      </div>
    `;

    const riderIcon = L.divIcon({
      className: 'rider-div-icon',
      html: riderHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderLat, riderLng]);
    } else {
      riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
    }

    // Custom Mobile Van / Biker Marker
    const provHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); pointer-events: auto;">
        <div style="position: absolute; width: 48px; height: 48px; background: rgba(6, 182, 212, 0.35); border-radius: 50%; animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="position: relative; width: 38px; height: 38px; background: #06b6d4; border: 2.5px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(6,182,212,0.65);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div style="background: #000; color: #06b6d4; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-top: 4px; white-space: nowrap; border: 1px solid #06b6d4; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          ${role === 'PROVIDER' ? 'Your Mobile Van' : providerName}
        </div>
      </div>
    `;

    const provIcon = L.divIcon({
      className: 'prov-div-icon',
      html: provHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const currLat = currentProvPos.lat || providerLat;
    const currLng = currentProvPos.lng || providerLng;

    if (providerMarkerRef.current) {
      providerMarkerRef.current.setLatLng([currLat, currLng]);
    } else {
      providerMarkerRef.current = L.marker([currLat, currLng], { icon: provIcon }).addTo(map);
    }

    // Generate Route Waypoints between Provider and Rider
    const midLat = (currLat + riderLat) / 2 + 0.002;
    const midLng = (currLng + riderLng) / 2 - 0.003;
    const routePoints = [
      [currLat, currLng],
      [midLat, midLng],
      [riderLat, riderLng]
    ];

    if (baseLineRef.current) map.removeLayer(baseLineRef.current);
    if (routeLineRef.current) map.removeLayer(routeLineRef.current);

    // Dark Street Route Track
    baseLineRef.current = L.polyline(routePoints, {
      color: '#0f172a',
      weight: 6,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Glowing Flowing Energy Route Polyline
    routeLineRef.current = L.polyline(routePoints, {
      color: '#10b981',
      weight: 4,
      opacity: 0.95,
      dashArray: '8, 10',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Fit Map to contain both markers nicely
    const bounds = L.latLngBounds([[currLat, currLng], [riderLat, riderLng]]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

    // Cleanup when component unmounts
    return () => {
      // Keep instance or cleanup on unmount
    };
  }, [riderLat, riderLng, providerLat, providerLng, currentProvPos, role, providerName, riderName]);

  // Cleanup map instance when unmounting component permanently
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Live real-time simulation: smoothly progress the provider van towards rider
  useEffect(() => {
    if (isArrived) {
      setActiveDistance(0);
      setActiveEta(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveDistance(prev => {
        if (prev <= 0.15) {
          clearInterval(interval);
          setActiveEta(0);
          return 0;
        }
        const next = Math.max(0, Number((prev - 0.12).toFixed(2)));
        setActiveEta(Math.max(1, Math.round(next * 2.2)));

        // Interpolate provider coordinates towards rider
        const ratio = Math.min(1, 0.08);
        setCurrentProvPos(cur => ({
          lat: cur.lat + (riderLat - cur.lat) * ratio,
          lng: cur.lng + (riderLng - cur.lng) * ratio
        }));

        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [riderLat, riderLng, isArrived]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([
      [currentProvPos.lat, currentProvPos.lng],
      [riderLat, riderLng]
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentProvPos.lat},${currentProvPos.lng}&destination=${riderLat},${riderLng}`;

  return (
    <div className={`relative w-full ${height} rounded-3xl overflow-hidden shadow-xl border border-gray-200/80 bg-slate-950 select-none group`}>
      
      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Ola/Rapido Style Live Trip Telemetry HUD */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Telemetry Pill */}
        <div className="bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-white flex items-center gap-3 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              {isArrived ? "Arrived" : "Live GPS"}
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Distance</div>
            <div className="text-xs font-black text-white">
              {isArrived ? "0.0 km" : `${activeDistance.toFixed(1)} km`}
            </div>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Arrival ETA</div>
            <div className="text-xs font-black text-cyan-400">
              {isArrived ? "Now!" : `~${activeEta} mins`}
            </div>
          </div>
        </div>

        {/* Right Action: Recenter & Google Maps Navigation Link */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Recenter map"
            className="p-2 rounded-xl bg-black/80 backdrop-blur-md text-white hover:bg-black border border-white/15 shadow-lg transition"
            title="Recenter route"
          >
            <LocateFixed className="h-4 w-4 text-emerald-400" />
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-xl font-black text-xs shadow-lg transition border border-emerald-400"
            title="Open Turn-by-Turn Navigation in Google Maps"
          >
            <Navigation className="h-3.5 w-3.5 fill-black" />
            <span>Turn-by-Turn</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        </div>
      </div>

      {/* Bottom Floating Address Bar (Ola / Rapido Style Pickup Pin Box) */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[400] pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200 shadow-2xl flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 flex-shrink-0 border border-emerald-200">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {role === 'RIDER' ? "Your Live Pickup Location" : "Rider Pickup Point"}
              </div>
              <div className="text-xs font-bold text-black truncate">
                {riderAddress || "Koramangala 4th Block, Bengaluru"}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {role === 'PROVIDER' ? 'Target Vehicle' : 'Verified GPS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVehicleMap;
