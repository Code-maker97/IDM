import React, { useEffect, useRef, useState } from "react";
import { X, Navigation2, MapPin, Flag, Sparkles, Loader2, Search, Crosshair } from "lucide-react";
import { api } from "../lib/api";

// Indore landmark quick-picks
const QUICK_PICKS = [
  { label: "Rajwada", lat: 22.7184, lng: 75.8548 },
  { label: "Sarafa Bazaar", lat: 22.7190, lng: 75.8580 },
  { label: "Vijay Nagar", lat: 22.7509, lng: 75.8959 },
  { label: "Palasia", lat: 22.7279, lng: 75.8920 },
  { label: "Bhawarkuan", lat: 22.6964, lng: 75.8648 },
  { label: "Indore Station", lat: 22.7205, lng: 75.8747 },
  { label: "Airport", lat: 22.7216, lng: 75.8011 },
];

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function GeocodeField({ label, icon: Icon, iconColor, value, setValue, myPos, allowMyLocation, testIdPrefix }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const debounced = useDebounced(query, 380);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!debounced || debounced.trim().length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await api.get("/geocode/search", { params: { q: debounced, limit: 6 } });
        if (!cancelled) setResults(res.data.results || []);
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoading(false); }
    };
    run();
    return () => { cancelled = true; };
  }, [debounced]);

  // Click outside closes
  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (p) => {
    setValue(p);
    setQuery(p.label || p.short || "");
    setOpen(false);
  };

  const useMy = () => {
    if (!myPos) return;
    const p = { label: "My current location", short: "My location", lat: myPos[0], lng: myPos[1], isMine: true };
    pick(p);
  };

  return (
    <div className="border border-rule rounded p-3 bg-canvas" ref={boxRef}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <div className="gov-label">{label}</div>
        {allowMyLocation && myPos && (
          <button
            data-testid={`${testIdPrefix}-use-my-location`}
            onClick={useMy}
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 border border-navy-700 text-navy-700 rounded hover:bg-navy-50"
          >
            <Crosshair className="w-3 h-3" /> Use my location
          </button>
        )}
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 border border-rule bg-white rounded">
          <Search className="w-4 h-4 text-muted ml-2.5" />
          <input
            data-testid={`${testIdPrefix}-input`}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); if (value) setValue(null); }}
            onFocus={() => setOpen(true)}
            placeholder="Search address, landmark, or area…"
            className="flex-1 py-2 pr-2 bg-transparent text-sm focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted mr-2" />}
        </div>

        {open && (results.length > 0 || query.length >= 2) && (
          <div className="absolute inset-x-0 top-full mt-1 bg-white border border-rule rounded shadow-gov z-40 max-h-60 overflow-y-auto">
            {results.length === 0 && !loading && (
              <div className="px-3 py-3 text-xs text-muted">No matches. Try a different spelling.</div>
            )}
            {results.map((r) => (
              <button
                key={r.osm_id != null ? `osm-${r.osm_id}` : r.label}
                data-testid={`${testIdPrefix}-result-${r.osm_id ?? r.label}`}
                onClick={() => pick(r)}
                className="w-full text-left px-3 py-2 hover:bg-navy-50 border-b border-rule last:border-0"
              >
                <div className="text-sm font-semibold text-ink truncate">{r.short}</div>
                <div className="text-[11px] text-muted truncate">{r.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {QUICK_PICKS.map((p) => (
          <button
            key={testIdPrefix + p.label}
            data-testid={`${testIdPrefix}-quick-${p.label.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => pick({ ...p, short: p.label, label: `${p.label}, Indore` })}
            className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
              value?.lat === p.lat && value?.lng === p.lng
                ? "bg-navy-700 text-white border-navy-700"
                : "bg-white border-rule hover:border-navy-700 text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value && (
        <div className="text-[11px] text-muted mt-2 font-mono truncate">
          ✓ {value.short || value.label} · {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}

export default function RouteSearchSheet({
  myPos, timeOfDay, onClose, routes, setRoutes, selectedRouteId, setSelectedRouteId,
  origin, setOrigin, dest, setDest,
}) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  const findRoutes = async () => {
    if (!origin || !dest) return;
    setLoading(true);
    setAiInsight(null);
    try {
      const res = await api.post("/routes/safest", {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: dest.lat, lng: dest.lng },
        time_of_day: timeOfDay,
      });
      setRoutes(res.data.routes);
      setSelectedRouteId(res.data.routes[0]?.route_id);
    } catch {
      alert("Could not compute routes. Please try again.");
    } finally { setLoading(false); }
  };

  const current = routes.find((r) => r.route_id === selectedRouteId);

  const analyze = async () => {
    if (!current) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/risk-analysis", {
        distance_km: current.distance_km,
        duration_min: current.duration_min,
        safety_score: current.safety_score,
        nearby_incidents: current.nearby_incidents,
        lighting_score: current.lighting_score,
        crowd_density: current.crowd_density,
        time_of_day: current.time_of_day,
      });
      setAiInsight(res.data.analysis);
    } catch {
      setAiInsight("Could not generate insight right now. Stay alert on well-lit, crowded paths.");
    } finally { setAiLoading(false); }
  };

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-30 bg-white border-t border-rule shadow-gov rounded-t-lg slide-up max-h-[75vh] overflow-y-auto"
      data-testid="route-search-sheet"
    >
      <div className="h-1 bg-saffron" />
      <div className="px-4 sm:px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="gov-label text-navy-700">Plan a route</div>
            <div className="font-heading text-lg font-bold mt-0.5">Find the safest way</div>
          </div>
          <button data-testid="close-search-btn" onClick={onClose} className="p-2 rounded hover:bg-canvas">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <GeocodeField
            label="From"
            icon={MapPin}
            iconColor="#0b3d91"
            value={origin}
            setValue={setOrigin}
            myPos={myPos}
            allowMyLocation
            testIdPrefix="origin"
          />
          <GeocodeField
            label="To"
            icon={Flag}
            iconColor="#138808"
            value={dest}
            setValue={setDest}
            myPos={myPos}
            testIdPrefix="dest"
          />
        </div>

        <button
          data-testid="find-safest-route-btn"
          disabled={!origin || !dest || loading}
          onClick={findRoutes}
          className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation2 className="w-4 h-4" />}
          {loading ? "Computing safest routes…" : "Find safest route"}
        </button>

        {routes.length > 0 && (
          <div className="mt-5 space-y-2" data-testid="route-results">
            <div className="gov-label mb-1">
              {routes.length} route{routes.length > 1 ? "s" : ""} · sorted by safety
            </div>
            {routes.map((r) => {
              const active = r.route_id === selectedRouteId;
              const tone =
                r.level === "safe" ? "border-l-ind_green text-ind_green"
                : r.level === "caution" ? "border-l-caution text-caution"
                : "border-l-sos text-sos";
              return (
                <button
                  key={r.route_id}
                  data-testid={`route-card-${r.route_id}`}
                  onClick={() => { setSelectedRouteId(r.route_id); setAiInsight(null); }}
                  className={`w-full text-left border border-rule border-l-4 ${tone.split(" ")[0]} rounded p-3 transition-all ${
                    active ? "bg-navy-50 border-navy-700" : "bg-white hover:border-navy-700"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className={`font-heading text-3xl font-bold ${tone.split(" ")[1]}`}>{r.safety_score}</div>
                    <div className={`gov-label ${tone.split(" ")[1]}`}>{r.level}</div>
                  </div>
                  <div className="text-xs text-muted mt-1 font-mono">
                    {r.distance_km} km · {r.duration_min} min walk · {r.nearby_incidents} incident(s) nearby
                  </div>
                  <div className="mt-2 flex gap-3 text-[11px] text-muted">
                    <span>Lighting {Math.round(r.lighting_score * 100)}%</span>
                    <span>·</span>
                    <span>Crowd {Math.round(r.crowd_density * 100)}%</span>
                  </div>
                </button>
              );
            })}

            {current && (
              <div className="mt-3">
                <button
                  data-testid="get-ai-insight-btn"
                  onClick={analyze}
                  disabled={aiLoading}
                  className="w-full border border-navy-700 text-navy-700 hover:bg-navy-50 font-semibold py-2.5 rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiLoading ? "Analyzing…" : "Get AI Safety Insight"}
                </button>
                {aiInsight && (
                  <div
                    data-testid="ai-insight-result"
                    className="mt-3 border border-navy-100 bg-navy-50 rounded p-4 text-sm text-ink whitespace-pre-wrap leading-relaxed"
                  >
                    {aiInsight}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
