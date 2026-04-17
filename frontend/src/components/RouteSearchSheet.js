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
  const [origin, setOrigin] = useState(null); // {lat, lng, label}
  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [expanded, setExpanded] = useState(true);

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
      console.error(e);
      alert("Could not compute routes. Please try again.");
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      setAiInsight("Could not generate insight right now. Stay alert on well-lit, crowded paths.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-30 glass-sheet rounded-t-3xl p-5 slide-up max-h-[70vh] overflow-y-auto"
      data-testid="route-search-sheet"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-heading uppercase tracking-[0.3em] text-zinc-500">Plan a route</div>
          <div className="font-heading text-lg font-bold mt-0.5">Find the safest way</div>
        </div>
        <button data-testid="close-search-btn" onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Origin */}
      <div className="border border-zinc-800 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <div className="text-[10px] font-heading uppercase tracking-[0.2em] text-zinc-500">From</div>
          <button
            data-testid="use-my-location-btn"
            onClick={useMyLocation}
            className="ml-auto text-[10px] font-heading uppercase tracking-[0.2em] px-2 py-1 border border-zinc-700 rounded-full hover:border-zinc-500"
          >
            Use my location
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={"o" + p.label}
              data-testid={`origin-preset-${p.label.toLowerCase()}`}
              onClick={() => setOrigin({ ...p })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                origin?.label === p.label && origin?.lat === p.lat
                  ? "bg-zinc-100 text-black border-zinc-100"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {origin && (
          <div className="text-xs text-zinc-400 mt-2 font-mono">
            {origin.label} · {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Destination */}
      <div className="border border-zinc-800 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Flag className="w-4 h-4 text-emerald-400" />
          <div className="text-[10px] font-heading uppercase tracking-[0.2em] text-zinc-500">To</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={"d" + p.label}
              data-testid={`dest-preset-${p.label.toLowerCase()}`}
              onClick={() => setDest({ ...p })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                dest?.label === p.label
                  ? "bg-zinc-100 text-black border-zinc-100"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {dest && (
          <div className="text-xs text-zinc-400 mt-2 font-mono">
            {dest.label} · {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
          </div>
        )}
      </div>

      <button
        data-testid="find-safest-route-btn"
        disabled={!origin || !dest || loading}
        onClick={findRoutes}
        className="w-full bg-white text-black font-heading font-semibold py-3.5 rounded-full disabled:opacity-40 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation2 className="w-4 h-4" />}
        {loading ? "Computing safest routes…" : "Find safest route"}
      </button>

      {/* Route results */}
      {routes.length > 0 && (
        <div className="mt-5 space-y-2" data-testid="route-results">
          <div className="text-[10px] font-heading uppercase tracking-[0.3em] text-zinc-500 mb-2">
            {routes.length} route{routes.length > 1 ? "s" : ""} · sorted by safety
          </div>
          {routes.map((r) => {
            const active = r.route_id === selectedRouteId;
            const col = r.level === "safe" ? "text-emerald-400" : r.level === "caution" ? "text-amber-400" : "text-red-400";
            return (
              <button
                key={r.route_id}
                data-testid={`route-card-${r.route_id}`}
                onClick={() => { setSelectedRouteId(r.route_id); setAiInsight(null); }}
                className={`w-full text-left border rounded-xl p-3 transition-all ${
                  active ? "border-zinc-100 bg-zinc-900" : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className={`font-heading text-3xl font-bold ${col}`}>{r.safety_score}</div>
                  <div className={`text-[10px] font-heading uppercase tracking-[0.2em] ${col}`}>{r.level}</div>
                </div>
                <div className="text-xs text-zinc-400 mt-1 font-mono">
                  {r.distance_km} km · {r.duration_min} min walk · {r.nearby_incidents} incident(s) nearby
                </div>
                <div className="mt-2 flex gap-3 text-[11px] text-zinc-500">
                  <span>Lighting {Math.round(r.lighting_score * 100)}%</span>
                  <span>·</span>
                  <span>Crowd {Math.round(r.crowd_density * 100)}%</span>
                </div>
              </button>
            );
          })}

          {/* AI insight */}
          {current && (
            <div className="mt-3">
              <button
                data-testid="get-ai-insight-btn"
                onClick={analyze}
                disabled={aiLoading}
                className="w-full border border-blue-800/60 bg-blue-950/40 text-blue-200 font-heading text-xs uppercase tracking-[0.2em] py-3 rounded-full hover:border-blue-500 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiLoading ? "Analyzing…" : "Get AI Safety Insight"}
              </button>
              {aiInsight && (
                <div
                  data-testid="ai-insight-result"
                  className="mt-3 border border-blue-900/60 bg-blue-950/30 rounded-xl p-4 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed"
                >
                  {aiInsight}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
