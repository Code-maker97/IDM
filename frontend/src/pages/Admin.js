import React, { useEffect, useState } from "react";
import { Shield, ArrowLeft, CheckCircle2, Flag, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export default function Admin() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [i, s] = await Promise.all([
        api.get("/admin/incidents"),
        api.get("/admin/stats"),
      ]);
      setIncidents(i.data.incidents || []);
      setStats(s.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id, patch) => {
    try {
      await api.patch(`/admin/incidents/${id}`, patch);
      await load();
    } catch {}
  };

  const filtered = incidents.filter(i => filter === "all" ? true : i.status === filter);

  const center = incidents.length
    ? [incidents[0].lat, incidents[0].lng]
    : [12.9716, 77.5946];

  return (
    <div className="min-h-screen bg-base text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app" className="p-2 rounded-full hover:bg-zinc-900" data-testid="back-to-app">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Shield className="w-5 h-5" />
          <div>
            <div className="font-heading font-bold tracking-tight">Admin Dashboard</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Incident moderation · Analytics</div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 p-6" data-testid="admin-stats">
        {[
          { label: "Total incidents", value: stats?.total_incidents ?? "—" },
          { label: "Active", value: stats?.active_incidents ?? "—", color: "text-amber-400" },
          { label: "Resolved", value: stats?.resolved_incidents ?? "—", color: "text-emerald-400" },
          { label: "Users", value: stats?.total_users ?? "—" },
          { label: "SOS triggers", value: stats?.total_sos ?? "—", color: "text-red-400" },
        ].map((c, i) => (
          <div key={i} className="border border-zinc-800 rounded-2xl p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{c.label}</div>
            <div className={`font-heading text-3xl font-bold mt-1 ${c.color || ""}`}>{c.value}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6">
        {/* Heatmap */}
        <div className="border border-zinc-800 rounded-2xl overflow-hidden h-[420px]">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="font-heading text-sm font-bold">Incident heatmap</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Size ∝ severity</div>
          </div>
          <div className="h-[calc(100%-46px)]">
            <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OSM &copy; CARTO" />
              {incidents.map((i) => (
                <CircleMarker
                  key={i.incident_id}
                  center={[i.lat, i.lng]}
                  radius={4 + (i.severity || 2) * 3}
                  pathOptions={{
                    color: i.severity >= 3 ? "#ef4444" : i.severity === 2 ? "#f59e0b" : "#eab308",
                    fillOpacity: 0.45,
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold uppercase">{i.category.replace(/_/g, " ")}</div>
                      <div>{i.description?.replace(/^seed_/, "") || "—"}</div>
                      <div>Status: {i.status}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Top categories */}
        <div className="border border-zinc-800 rounded-2xl p-4 h-[420px] flex flex-col">
          <div className="font-heading text-sm font-bold mb-3">Top incident types</div>
          {stats?.top_categories?.length ? (
            <div className="space-y-2">
              {stats.top_categories.map((c) => {
                const max = stats.top_categories[0].count || 1;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="uppercase tracking-wider text-zinc-400">{c.category.replace(/_/g, " ")}</span>
                      <span className="font-mono text-zinc-500">{c.count}</span>
                    </div>
                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-100 rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-zinc-500 text-xs">No data yet.</div>
          )}
        </div>
      </section>

      {/* Moderation */}
      <section className="px-6 pb-12">
        <div className="flex items-center justify-between mb-3">
          <div className="font-heading text-sm font-bold">Incident moderation</div>
          <div className="flex gap-1 bg-zinc-900 rounded-full p-1">
            {["all", "active", "resolved", "flagged"].map((f) => (
              <button
                key={f}
                data-testid={`filter-${f}`}
                onClick={() => setFilter(f)}
                className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${
                  filter === f ? "bg-zinc-100 text-black" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="text-xs text-zinc-500"><Loader2 className="w-4 h-4 animate-spin inline" /> Loading…</div>}

        <div className="border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm" data-testid="admin-incident-table">
            <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <tr>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-left px-4 py-2">Severity</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.incident_id} className="border-t border-zinc-900">
                  <td className="px-4 py-2 uppercase tracking-wider text-xs">{i.category.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-zinc-400 text-xs max-w-[260px] truncate">{i.description?.replace(/^seed_/, "") || "—"}</td>
                  <td className="px-4 py-2 text-xs">{i.severity}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      i.status === "active" ? "bg-amber-900/40 text-amber-300"
                      : i.status === "resolved" ? "bg-emerald-900/40 text-emerald-300"
                      : "bg-zinc-800 text-zinc-300"
                    }`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-2 flex gap-1">
                    <button
                      data-testid={`resolve-${i.incident_id}`}
                      onClick={() => update(i.incident_id, { status: "resolved" })}
                      className="p-1.5 rounded-full hover:bg-emerald-900/40 text-emerald-300"
                      title="Resolve"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      data-testid={`flag-${i.incident_id}`}
                      onClick={() => update(i.incident_id, { status: "flagged" })}
                      className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400"
                      title="Flag"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && !loading && (
                <tr><td colSpan={5} className="text-center px-4 py-8 text-zinc-500 text-xs">No incidents.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
