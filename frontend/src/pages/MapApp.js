import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { Shield, Siren, MessageCircle, Users, AlertTriangle, Navigation2, LogOut, LayoutDashboard, Search, X, Crosshair, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../lib/api";
import RouteSearchSheet from "../components/RouteSearchSheet";
import SOSPanel from "../components/SOSPanel";
import AIChatbot from "../components/AIChatbot";
import IncidentReportModal from "../components/IncidentReportModal";
import TrustedContactsModal from "../components/TrustedContactsModal";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bangalore

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom() < 14 ? 14 : map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

function FitRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords || coords.length === 0) return;
    const latlngs = coords.map((c) => [c[1], c[0]]);
    map.fitBounds(latlngs, { padding: [60, 60] });
  }, [coords, map]);
  return null;
}

const incidentIcon = (severity) => {
  const color = severity >= 3 ? "#ef4444" : severity === 2 ? "#f59e0b" : "#eab308";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #09090b;box-shadow:0 0 10px ${color}"></div>`,
  });
};

const userIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 12px rgba(59,130,246,0.8)"></div>`,
});

export default function MapApp() {
  const { user, logout } = useAuth();
  const [myPos, setMyPos] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [showSearch, setShowSearch] = useState(true);
  const [showSOS, setShowSOS] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const h = new Date().getHours();
    return h >= 19 || h < 6 ? "night" : "day";
  });

  // Geolocate
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
      () => setMyPos(DEFAULT_CENTER),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Load incidents
  const loadIncidents = async () => {
    try {
      const res = await api.get("/incidents", { params: { limit: 200 } });
      setIncidents(res.data.incidents || []);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { loadIncidents(); }, []);

  const selectedRoute = useMemo(
    () => routes.find((r) => r.route_id === selectedRouteId),
    [routes, selectedRouteId]
  );

  const mapCenter = myPos || DEFAULT_CENTER;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-base text-zinc-100">
      {/* MAP (z-0) */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full" zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM &copy; CARTO'
          />
          <RecenterMap center={myPos} />
          {selectedRoute && <FitRoute coords={selectedRoute.geometry} />}

          {myPos && (
            <Marker position={myPos} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {/* Incidents */}
          {incidents.map((inc) => (
            <Marker key={inc.incident_id} position={[inc.lat, inc.lng]} icon={incidentIcon(inc.severity || 2)}>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold uppercase mb-1">{inc.category.replace(/_/g, " ")}</div>
                  <div>{inc.description?.replace(/^seed_/, "") || "No description"}</div>
                  <div className="mt-1 opacity-70">Severity: {inc.severity}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route polylines */}
          {routes.map((r) => {
            const latlngs = r.geometry.map((c) => [c[1], c[0]]);
            const isSelected = r.route_id === selectedRouteId;
            const color = r.level === "safe" ? "#10b981" : r.level === "caution" ? "#f59e0b" : "#ef4444";
            return (
              <Polyline
                key={r.route_id}
                positions={latlngs}
                pathOptions={{
                  color,
                  weight: isSelected ? 7 : 4,
                  opacity: isSelected ? 0.95 : 0.45,
                  dashArray: isSelected ? null : "6 8",
                }}
                eventHandlers={{ click: () => setSelectedRouteId(r.route_id) }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* TOP BAR */}
      <header className="absolute top-0 inset-x-0 z-20 px-4 pt-4 pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-full px-4 py-2">
            <Shield className="w-4 h-4 text-zinc-100" strokeWidth={2.2} />
            <span className="font-heading font-bold text-sm tracking-tight">AEGIS</span>
            <span className="text-[10px] font-heading uppercase tracking-[0.2em] text-zinc-500 ml-1">
              · {timeOfDay}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              data-testid="toggle-time-btn"
              onClick={() => setTimeOfDay(timeOfDay === "night" ? "day" : "night")}
              className="text-[10px] font-heading uppercase tracking-[0.2em] px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-full hover:border-zinc-600"
            >
              Switch {timeOfDay === "night" ? "day" : "night"}
            </button>
            <button
              data-testid="open-contacts-btn"
              onClick={() => setShowContacts(true)}
              className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-full p-2.5 hover:border-zinc-600"
              title="Trusted contacts"
            >
              <Users className="w-4 h-4" />
            </button>
            {user?.is_admin && (
              <Link
                to="/admin"
                data-testid="admin-nav-link"
                className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-full p-2.5 hover:border-zinc-600"
                title="Admin"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            )}
            <button
              data-testid="logout-btn"
              onClick={logout}
              className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-full p-2.5 hover:border-zinc-600"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search button */}
        {!showSearch && (
          <div className="mt-3 pointer-events-auto">
            <button
              data-testid="open-search-btn"
              onClick={() => setShowSearch(true)}
              className="w-full bg-zinc-950/85 backdrop-blur-xl border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-zinc-600 text-left"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Where do you want to go?</span>
            </button>
          </div>
        )}
      </header>

      {/* Recenter */}
      {myPos && (
        <button
          data-testid="recenter-btn"
          onClick={() => setMyPos([...myPos])}
          className="absolute right-4 bottom-44 z-30 bg-zinc-950/85 backdrop-blur-xl border border-zinc-800 rounded-full p-3 hover:border-zinc-600"
          title="Recenter"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      )}

      {/* Report Incident FAB */}
      <button
        data-testid="open-report-btn"
        onClick={() => setShowReport(true)}
        className="absolute left-4 bottom-44 z-30 bg-amber-500 text-black rounded-full p-3 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-transform"
        title="Report incident"
      >
        <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* AI Chat FAB */}
      <button
        data-testid="ai-safety-chat-trigger"
        onClick={() => setShowChat(true)}
        className="absolute left-4 bottom-28 z-40 bg-blue-600 text-white rounded-full px-4 py-3 shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
      >
        <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
        <span className="font-heading text-xs font-semibold uppercase tracking-wider">Aegis AI</span>
      </button>

      {/* SOS button */}
      <button
        data-testid="sos-panic-button"
        onClick={() => setShowSOS(true)}
        className="absolute right-4 bottom-28 z-40 w-16 h-16 rounded-full bg-sos text-white font-heading font-bold text-lg shadow-sos sos-pulse hover:scale-105 transition-transform flex items-center justify-center"
      >
        SOS
      </button>

      {/* Bottom search sheet */}
      {showSearch && (
        <RouteSearchSheet
          myPos={myPos}
          timeOfDay={timeOfDay}
          onClose={() => setShowSearch(false)}
          routes={routes}
          setRoutes={setRoutes}
          selectedRouteId={selectedRouteId}
          setSelectedRouteId={setSelectedRouteId}
        />
      )}

      {/* Modals */}
      {showSOS && <SOSPanel myPos={myPos} onClose={() => setShowSOS(false)} />}
      {showChat && <AIChatbot onClose={() => setShowChat(false)} />}
      {showReport && (
        <IncidentReportModal
          myPos={myPos}
          timeOfDay={timeOfDay}
          onClose={() => setShowReport(false)}
          onReported={loadIncidents}
        />
      )}
      {showContacts && <TrustedContactsModal onClose={() => setShowContacts(false)} />}
    </div>
  );
}
