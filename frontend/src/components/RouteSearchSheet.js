import React, { useState } from "react";
import { X, Navigation2, MapPin, Flag, Sparkles, Loader2 } from "lucide-react";
import { api } from "../lib/api";

const PRESETS = [
  { label: "MG Road", lat: 12.9758, lng: 77.6063 },
  { label: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { label: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { label: "Whitefield", lat: 12.9698, lng: 77.7500 },
  { label: "Jayanagar", lat: 12.9260, lng: 77.5800 },
];

export default function RouteSearchSheet({
  myPos, timeOfDay, onClose, routes, setRoutes, selectedRouteId, setSelectedRouteId,
}) {
  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  const useMyLocation = () => {
    if (myPos) setOrigin({ lat: myPos[0], lng: myPos[1], label: "My location" });
  };

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
    } catch (e) {
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

  const PresetRow = ({ value, setValue, testIdPrefix }) => (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={testIdPrefix + p.label}
          data-testid={`${testIdPrefix}-${p.label.toLowerCase()}`}
          onClick={() => setValue({ ...p })}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            value?.label === p.label && value?.lat === p.lat
              ? "bg-navy-700 text-white border-navy-700"
              : "bg-white border-rule hover:border-navy-700 text-ink"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-30 bg-white border-t border-rule shadow-gov rounded-t-lg slide-up max-h-[72vh] overflow-y-auto"
      data-testid="route-search-sheet"
    >
      {/* Saffron tab top */}
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

        {/* Origin */}
        <div className="border border-rule rounded p-3 mb-3 bg-canvas">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-navy-700" />
            <div className="gov-label">From</div>
            <button
              data-testid="use-my-location-btn"
              onClick={useMyLocation}
              className="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 border border-navy-700 text-navy-700 rounded hover:bg-navy-50"
            >
              Use my location
            </button>
          </div>
          <PresetRow value={origin} setValue={setOrigin} testIdPrefix="origin-preset" />
          {origin && (
            <div className="text-xs text-muted mt-2 font-mono">
              {origin.label} · {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="border border-rule rounded p-3 mb-4 bg-canvas">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-ind_green" />
            <div className="gov-label">To</div>
          </div>
          <PresetRow value={dest} setValue={setDest} testIdPrefix="dest-preset" />
          {dest && (
            <div className="text-xs text-muted mt-2 font-mono">
              {dest.label} · {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
            </div>
          )}
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

        {/* Results */}
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
