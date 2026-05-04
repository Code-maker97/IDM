import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Shield, Siren, MessageCircle, Users, AlertTriangle, LogOut, LayoutDashboard, Search, Crosshair, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../lib/api";
import RouteSearchSheet from "../components/RouteSearchSheet";
import SOSPanel from "../components/SOSPanel";
import AIChatbot from "../components/AIChatbot";
import IncidentReportModal from "../components/IncidentReportModal";
import TrustedContactsModal from "../components/TrustedContactsModal";
import { Tricolor } from "../components/GovChrome";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [22.7196, 75.8577]; // Indore, Madhya Pradesh

const incidentIcon = (severity) => {
  const color = severity >= 3 ? "#c0202b" : severity === 2 ? "#d97706" : "#ca8a04";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 2px ${color}55"></div>`,
  });
};
const userIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#0b3d91;border:3px solid #fff;box-shadow:0 0 0 3px rgba(11,61,145,0.35)"></div>`,
});

function FitRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords?.length) return;
    const latlngs = coords.map((c) => [c[1], c[0]]);
    map.fitBounds(latlngs, { padding: [60, 60] });
  }, [coords, map]);
  return null;
}

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

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
      () => setMyPos(DEFAULT_CENTER),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

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
    <div className="relative h-[100dvh] w-full overflow-hidden bg-canvas text-ink flex flex-col">
      {/* TOP STRIP — government chrome */}
      <Tricolor />
      <header className="bg-navy-700 text-white relative z-30">
        <div className="px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="chakra shrink-0" style={{ filter: "invert(1)" }} aria-label="emblem" />
            <div className="leading-tight min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-heading font-bold text-base sm:text-lg whitespace-nowrap">SurakshitPath</span>
                <span className="font-hindi text-sm hidden sm:inline">सुरक्षित पथ</span>
              </div>
              <div className="text-[10px] opacity-80 truncate">
                Citizen portal · {user?.name || "Signed in"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              data-testid="toggle-time-btn"
              onClick={() => setTimeOfDay(timeOfDay === "night" ? "day" : "night")}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded text-[11px] font-medium"
              title="Toggle day/night model"
            >
              {timeOfDay === "night" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline uppercase tracking-wider">{timeOfDay}</span>
            </button>
            <button
              data-testid="open-contacts-btn"
              onClick={() => setShowContacts(true)}
              className="bg-white/10 hover:bg-white/20 p-2 rounded"
              title="Trusted contacts"
            >
              <Users className="w-4 h-4" />
            </button>
            {user?.is_admin && (
              <Link
                to="/admin"
                data-testid="admin-nav-link"
                className="bg-saffron text-ink hover:bg-saffron/85 p-2 rounded"
                title="Admin Console"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            )}
            <button
              data-testid="logout-btn"
              onClick={logout}
              className="bg-white/10 hover:bg-white/20 p-2 rounded"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAP */}
      <div className="relative flex-1">
        <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full" zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          {selectedRoute && <FitRoute coords={selectedRoute.geometry} />}

          {myPos && (
            <Marker position={myPos} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

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

          {routes.map((r) => {
            const latlngs = r.geometry.map((c) => [c[1], c[0]]);
            const isSelected = r.route_id === selectedRouteId;
            const color = r.level === "safe" ? "#138808" : r.level === "caution" ? "#d97706" : "#c0202b";
            return (
              <Polyline
                key={r.route_id}
                positions={latlngs}
                pathOptions={{
                  color,
                  weight: isSelected ? 7 : 4,
                  opacity: isSelected ? 0.95 : 0.5,
                  dashArray: isSelected ? null : "6 8",
                }}
                eventHandlers={{ click: () => setSelectedRouteId(r.route_id) }}
              />
            );
          })}
        </MapContainer>

        {/* Quick search bar (when sheet closed) */}
        {!showSearch && (
          <div className="absolute top-3 inset-x-3 z-20">
            <button
              data-testid="open-search-btn"
              onClick={() => setShowSearch(true)}
              className="w-full bg-white border border-rule rounded-md px-4 py-3 flex items-center gap-3 hover:border-navy-700 text-left shadow-gov"
            >
              <Search className="w-4 h-4 text-navy-700" />
              <span className="text-sm text-muted">Where do you want to go?</span>
            </button>
          </div>
        )}

        {/* Recenter */}
        {myPos && (
          <button
            data-testid="recenter-btn"
            onClick={() => setMyPos([...myPos])}
            className="absolute right-3 bottom-44 z-20 bg-white border border-rule rounded-full p-3 hover:border-navy-700 shadow-gov"
            title="Recenter"
          >
            <Crosshair className="w-4 h-4 text-navy-700" />
          </button>
        )}

        {/* Report */}
        <button
          data-testid="open-report-btn"
          onClick={() => setShowReport(true)}
          className="absolute left-3 bottom-44 z-20 bg-saffron text-ink rounded-full p-3 shadow-gov hover:scale-105 transition-transform"
          title="Report incident"
        >
          <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* AI Chat */}
        <button
          data-testid="ai-safety-chat-trigger"
          onClick={() => setShowChat(true)}
          className="absolute left-3 bottom-28 z-30 bg-navy-700 hover:bg-navy-800 text-white rounded-full pl-3 pr-4 py-3 shadow-gov flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-xs font-semibold">Aegis AI</span>
        </button>

        {/* SOS */}
        <button
          data-testid="sos-panic-button"
          onClick={() => setShowSOS(true)}
          className="absolute right-3 bottom-28 z-30 w-16 h-16 rounded-full bg-sos text-white font-heading font-bold text-base sos-pulse hover:scale-105 transition-transform flex flex-col items-center justify-center"
        >
          <Siren className="w-5 h-5" strokeWidth={2.5} />
          <span className="text-[10px] tracking-widest mt-0.5">SOS</span>
        </button>
      </div>

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
