import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ExternalLink, LocateFixed, MapPin, Navigation, Radio } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let googleMapsPromise;

const loadGoogleMaps = () => {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('Add VITE_GOOGLE_MAPS_API_KEY to the frontend environment.'));

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => {
        googleMapsPromise = null;
        reject(new Error('Google Maps could not be loaded. Check the API key and enabled APIs.'));
      };
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
};

const toPosition = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  const position = { lat: Number(lat), lng: Number(lng) };
  return Number.isFinite(position.lat) && Number.isFinite(position.lng) ? position : null;
};

const distanceBetween = (first, second) => {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latDelta = radians(second.lat - first.lat);
  const lngDelta = radians(second.lng - first.lng);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(first.lat)) * Math.cos(radians(second.lat)) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const LiveVehicleMap = ({
  riderLat = 12.9716,
  riderLng = 77.5946,
  riderAddress = 'Current EV Location',
  providerLat,
  providerLng,
  providerName = 'Mobile Charger',
  riderName = 'Rider EV',
  requestId,
  status = 'ON_THE_WAY',
  distanceKm,
  etaMinutes,
  onRouteMetrics,
  role = 'RIDER',
  height = 'h-[360px] sm:h-[440px]'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const providerMarkerRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const routeRequestRef = useRef(null);
  const watchIdRef = useRef(null);
  const onRouteMetricsRef = useRef(onRouteMetrics);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [providerPosition, setProviderPosition] = useState(() => toPosition(providerLat, providerLng));
  const [routeMetrics, setRouteMetrics] = useState(() => {
    if (!toPosition(providerLat, providerLng)) return null;
    const distance = Number(distanceKm);
    const eta = Number(etaMinutes);
    return Number.isFinite(distance) && Number.isFinite(eta) ? { distanceKm: distance, etaMinutes: eta } : null;
  });

  const riderPosition = toPosition(riderLat, riderLng) || { lat: 12.9716, lng: 77.5946 };
  const isArrived = status === 'ARRIVED';
  const isProviderTracking = role === 'PROVIDER' && ['ACCEPTED', 'ON_THE_WAY'].includes(status);

  onRouteMetricsRef.current = onRouteMetrics;

  useEffect(() => {
    const nextPosition = toPosition(providerLat, providerLng);
    if (nextPosition) setProviderPosition(nextPosition);
  }, [providerLat, providerLng]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps().then((maps) => {
      if (cancelled || !mapContainerRef.current) return;

      const map = new maps.Map(mapContainerRef.current, {
        center: riderPosition,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ]
      });
      const riderMarker = new maps.Marker({
        map,
        position: riderPosition,
        title: role === 'RIDER' ? 'Your EV pickup' : riderName,
        label: { text: 'R', color: '#ffffff', fontWeight: '700' },
        icon: { path: maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#111827', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 }
      });
      const providerMarker = new maps.Marker({
        map: null,
        title: role === 'PROVIDER' ? 'Your live location' : providerName,
        label: { text: 'P', color: '#052e16', fontWeight: '700' },
        icon: { path: maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#34d399', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 }
      });
      const directionsRenderer = new maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: { strokeColor: '#059669', strokeOpacity: 0.9, strokeWeight: 6 }
      });

      mapInstanceRef.current = map;
      riderMarkerRef.current = riderMarker;
      providerMarkerRef.current = providerMarker;
      directionsServiceRef.current = new maps.DirectionsService();
      directionsRendererRef.current = directionsRenderer;
      setMapError('');
      setMapReady(true);
    }).catch((error) => {
      if (!cancelled) setMapError(error.message || 'Google Maps is unavailable.');
    });

    return () => {
      cancelled = true;
      directionsRendererRef.current?.setMap(null);
      riderMarkerRef.current?.setMap(null);
      providerMarkerRef.current?.setMap(null);
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !riderMarkerRef.current || !providerMarkerRef.current) return;

    const maps = window.google.maps;
    const map = mapInstanceRef.current;
    riderMarkerRef.current.setPosition(riderPosition);

    if (!providerPosition) {
      providerMarkerRef.current.setMap(null);
      directionsRendererRef.current.set('directions', null);
      setRouteMetrics(null);
      onRouteMetricsRef.current?.(null);
      return;
    }

    providerMarkerRef.current.setMap(map);
    providerMarkerRef.current.setPosition(providerPosition);

    if (isArrived) {
      setRouteMetrics({ distanceKm: 0, etaMinutes: 0 });
      onRouteMetricsRef.current?.({ distanceKm: 0, etaMinutes: 0 });
      directionsRendererRef.current.set('directions', null);
      return;
    }

    const now = Date.now();
    const lastRequest = routeRequestRef.current;
    const movedKm = lastRequest ? distanceBetween(lastRequest.position, providerPosition) : Infinity;
    if (lastRequest && movedKm < 0.25 && now - lastRequest.time < 30000) return;
    routeRequestRef.current = { position: providerPosition, time: now };

    directionsServiceRef.current.route({
      origin: providerPosition,
      destination: riderPosition,
      travelMode: maps.TravelMode.DRIVING,
      drivingOptions: { departureTime: new Date(), trafficModel: maps.TrafficModel.BEST_GUESS }
    }, (result, routeStatus) => {
      if (routeStatus === maps.DirectionsStatus.OK && result?.routes?.[0]?.legs?.[0]) {
        directionsRendererRef.current.setDirections(result);
        const leg = result.routes[0].legs[0];
        const metrics = {
          distanceKm: leg.distance.value / 1000,
          etaMinutes: Math.max(1, Math.ceil((leg.duration_in_traffic?.value || leg.duration.value) / 60))
        };
        setRouteMetrics(metrics);
        onRouteMetricsRef.current?.(metrics);
        if (!lastRequest) {
          map.fitBounds(result.routes[0].bounds, { top: 90, right: 40, bottom: 90, left: 40 });
        }
        setMapError('');
        return;
      }

      const directDistance = distanceBetween(providerPosition, riderPosition);
      const fallbackMetrics = {
        distanceKm: directDistance,
        etaMinutes: Math.max(1, Math.ceil(directDistance * 2.5))
      };
      setRouteMetrics(fallbackMetrics);
      onRouteMetricsRef.current?.(fallbackMetrics);
      setMapError('Road route unavailable. Showing direct range.');
    });
  }, [mapReady, riderLat, riderLng, providerPosition, isArrived]);

  useEffect(() => {
    if (!isProviderTracking || !requestId || !navigator.geolocation) return undefined;

    let lastSentPosition = null;
    let lastSentAt = 0;
    setGpsError('');
    watchIdRef.current = navigator.geolocation.watchPosition(async (position) => {
      const nextPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      if (position.coords.accuracy > 150) return;

      setProviderPosition(nextPosition);
      setGpsError('');
      const now = Date.now();
      const movedKm = lastSentPosition ? distanceBetween(lastSentPosition, nextPosition) : Infinity;
      if (lastSentPosition && movedKm < 0.015 && now - lastSentAt < 10000) return;

      lastSentPosition = nextPosition;
      lastSentAt = now;
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/requests/${requestId}/tracking`, nextPosition, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        setGpsError('Could not sync live location.');
      }
    }, (error) => {
      setGpsError(error.code === 1 ? 'Allow location access to share live GPS.' : 'Waiting for an accurate GPS signal.');
    }, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    });

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, [isProviderTracking, requestId]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!providerPosition) {
      map.setCenter(riderPosition);
      map.setZoom(15);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(riderPosition);
    bounds.extend(providerPosition);
    map.fitBounds(bounds, { top: 90, right: 40, bottom: 90, left: 40 });
  };

  const googleMapsUrl = providerPosition
    ? `https://www.google.com/maps/dir/?api=1&origin=${providerPosition.lat},${providerPosition.lng}&destination=${riderPosition.lat},${riderPosition.lng}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${riderPosition.lat},${riderPosition.lng}`;
  const shownDistance = isArrived ? '0.0 km' : routeMetrics ? `${routeMetrics.distanceKm.toFixed(1)} km` : '--';
  const shownEta = isArrived ? 'Arrived' : routeMetrics ? `~${routeMetrics.etaMinutes} min` : 'Waiting for GPS';

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-3xl border border-gray-200 bg-slate-100 shadow-xl`}>
      <div ref={mapContainerRef} className="h-full w-full" aria-label="Live Google map between rider and provider" />

      {mapError && (
        <div className="absolute inset-x-3 top-20 z-10 rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-xs font-semibold text-amber-900 shadow-md">
          {mapError}
        </div>
      )}

      <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/90 px-3.5 py-2 text-white shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <Radio className={`h-3.5 w-3.5 ${providerPosition ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-[11px] font-black uppercase text-emerald-300">{isArrived ? 'Arrived' : providerPosition ? 'Live GPS' : 'GPS pending'}</span>
          </div>
          <span className="h-5 w-px bg-white/20" />
          <div>
            <div className="text-[9px] font-bold uppercase text-gray-400">Road range</div>
            <div className="text-xs font-black">{shownDistance}</div>
          </div>
          <span className="h-5 w-px bg-white/20" />
          <div>
            <div className="text-[9px] font-bold uppercase text-gray-400">ETA</div>
            <div className="text-xs font-black text-cyan-300">{shownEta}</div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button type="button" onClick={handleRecenter} aria-label="Recenter map" title="Recenter route" className="rounded-xl border border-white/15 bg-slate-950/85 p-2 text-white shadow-lg hover:bg-black">
            <LocateFixed className="h-4 w-4 text-emerald-400" />
          </button>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" title="Open route in Google Maps" className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-500 px-3 py-2 text-xs font-black text-black shadow-lg hover:bg-emerald-400">
            <Navigation className="h-3.5 w-3.5" />
            <span>Directions</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-10 sm:right-auto sm:max-w-md">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 text-left shadow-xl backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex-shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700"><MapPin className="h-4 w-4" /></div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase text-gray-400">{role === 'RIDER' ? 'Your pickup point' : 'Rider pickup point'}</div>
              <div className="truncate text-xs font-bold text-black">{riderAddress || 'Current GPS location'}</div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[10px] font-bold text-gray-500">{role === 'PROVIDER' ? 'Sharing status' : providerName}</div>
            <div className="max-w-40 truncate text-[10px] font-semibold text-emerald-700">{role === 'PROVIDER' ? (gpsError || (isProviderTracking ? 'Sharing live location' : 'Location paused')) : (gpsError || (providerPosition ? 'Provider location received' : 'Waiting for provider GPS'))}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVehicleMap;
