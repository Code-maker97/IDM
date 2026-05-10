import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Flag, Loader2, MapPin, Upload, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Masthead, GovFooter } from "../components/GovChrome";

const SAMPLE_BULK_JSON = `[
  {"category":"harassment","lat":22.7509,"lng":75.8959,"severity":2,"description":"Late-night catcalling near C21 Mall"},
  {"category":"poor_lighting","lat":22.7279,"lng":75.8920,"severity":2,"description":"Broken street lamps on Palasia Square"},
  {"category":"theft","lat":22.7205,"lng":75.8747,"severity":3,"description":"Bag snatching reported at Indore station"}
]`;

function BulkImportPanel({ onImported }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    setMsg(null); setBusy(true);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array");
      const res = await api.post("/admin/incidents/bulk", { incidents: parsed });
      setMsg({ ok: true, text: `Imported ${res.data.inserted} incidents · total now ${res.data.total_now}` });
      setText("");
      onImported && onImported();
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.detail || e.message || "Import failed" });
    } finally { setBusy(false); }
  };

  return (
    <div className="gov-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-navy-700" />
        <div className="font-heading text-sm font-bold">Bulk incident import</div>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted">Partnership data / datasets</span>
      </div>
      <div className="text-xs text-muted mb-3">
        Paste a JSON array of incidents from a public crime dataset, police FIR export, or partner NGO feed.
        Each record needs <code className="font-mono">category, lat, lng, severity</code> (1-3), and optional <code className="font-mono">description</code>.
      </div>
      <textarea
        data-testid="bulk-import-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={SAMPLE_BULK_JSON}
        rows={8}
        className="gov-input font-mono text-[12px]"
      />
      <div className="flex items-center gap-2 mt-3">
        <button
          data-testid="bulk-import-sample-btn"
          type="button"
          onClick={() => setText(SAMPLE_BULK_JSON)}
          className="text-xs font-semibold uppercase tracking-wider px-3 py-2 border border-rule rounded hover:border-navy-700"
        >
          Load sample
        </button>
        <button
          data-testid="bulk-import-submit-btn"
          onClick={submit}
          disabled={busy || !text.trim()}
          className="ml-auto bg-navy-700 hover:bg-navy-800 text-white font-semibold px-4 py-2 rounded text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Import
        </button>
      </div>
      {msg && (
        <div
          data-testid="bulk-import-result"
          className={`mt-3 text-xs px-3 py-2 rounded border ${
            msg.ok ? "bg-ind_green/10 border-ind_green/40 text-ind_green" : "bg-sos/10 border-sos/40 text-sos"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}

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
    try { await api.patch(`/admin/incidents/${id}`, patch); await load(); } catch (error) {
      console.error("Failed to update incident:", error);
    }
  };

  const filtered = incidents.filter(i => filter === "all" ? true : i.status === filter);
  const center = incidents.length ? [incidents[0].lat, incidents[0].lng] : [22.7196, 75.8577];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Masthead subPage="Admin Console · Incident Moderation" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-heading text-2xl font-bold">Admin Console</h1>
            <div className="text-xs text-muted">Incident moderation · risk analytics · civic insights</div>
          </div>
          <Link to="/app" className="inline-flex items-center gap-1.5 text-sm text-navy-700 hover:underline" data-testid="back-to-app">
            <ArrowLeft className="w-4 h-4" /> Back to citizen view
          </Link>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6" data-testid="admin-stats">
          {[
            { label: "Total incidents", value: stats?.total_incidents ?? "—" },
            { label: "Active", value: stats?.active_incidents ?? "—", color: "text-caution" },
            { label: "Resolved", value: stats?.resolved_incidents ?? "—", color: "text-ind_green" },
            { label: "Registered users", value: stats?.total_users ?? "—" },
            { label: "SOS triggers", value: stats?.total_sos ?? "—", color: "text-sos" },
          ].map((c) => (
            <div key={c.label} className="gov-card p-4">
              <div className="gov-label">{c.label}</div>
              <div className={`font-heading text-3xl font-bold mt-1 ${c.color || "text-navy-700"}`}>{c.value}</div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Heatmap */}
          <div className="gov-card overflow-hidden h-[420px] flex flex-col">
            <div className="px-4 py-2.5 border-b border-rule flex items-center justify-between bg-canvas">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-navy-700" />
                <div className="font-heading text-sm font-bold">Incident heatmap</div>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Size ∝ severity</div>
            </div>
            <div className="flex-1">
              <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap contributors &copy; CARTO' maxZoom={20} subdomains="abcd" />
                {incidents.map((i) => (
                  <CircleMarker
                    key={i.incident_id}
                    center={[i.lat, i.lng]}
                    radius={4 + (i.severity || 2) * 3}
                    pathOptions={{
                      color: i.severity >= 3 ? "#c0202b" : i.severity === 2 ? "#d97706" : "#ca8a04",
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
          <div className="gov-card p-5 h-[420px] flex flex-col">
            <div className="font-heading text-sm font-bold mb-4">Top incident types</div>
            {stats?.top_categories?.length ? (
              <div className="space-y-3">
                {stats.top_categories.map((c) => {
                  const max = stats.top_categories[0].count || 1;
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="uppercase tracking-wider text-ink font-semibold">{c.category.replace(/_/g, " ")}</span>
                        <span className="font-mono text-muted">{c.count}</span>
                      </div>
                      <div className="h-2.5 bg-canvas rounded overflow-hidden border border-rule">
                        <div className="h-full bg-navy-700 rounded" style={{ width: `${(c.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted text-xs">No data yet.</div>
            )}
            <div className="mt-auto pt-4 border-t border-rule text-[11px] text-muted">
              Aggregated from citizen reports across the city. Data refreshes every 60 seconds.
            </div>
          </div>
        </section>

        {/* Bulk import */}
        <section className="mb-6">
          <BulkImportPanel onImported={load} />
        </section>

        {/* Moderation table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="font-heading text-base font-bold">Incident moderation queue</div>
            <div className="flex gap-1 border border-rule bg-white rounded p-1">
              {["all", "active", "resolved", "flagged"].map((f) => (
                <button
                  key={f}
                  data-testid={`filter-${f}`}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded font-semibold ${
                    filter === f ? "bg-navy-700 text-white" : "text-muted hover:text-navy-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-xs text-muted flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          )}

          <div className="gov-card overflow-hidden">
            <table className="w-full text-sm" data-testid="admin-incident-table">
              <thead className="bg-navy-700 text-white text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Description</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Severity</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i, idx) => (
                  <tr key={i.incident_id} className={`border-t border-rule ${idx % 2 ? "bg-canvas" : "bg-white"}`}>
                    <td className="px-4 py-2.5 uppercase tracking-wider text-xs font-semibold">{i.category.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2.5 text-muted text-xs max-w-[260px] truncate">{i.description?.replace(/^seed_/, "") || "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">{i.severity}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        i.status === "active" ? "bg-caution/15 text-caution"
                        : i.status === "resolved" ? "bg-ind_green/15 text-ind_green"
                        : "bg-rule/30 text-muted"
                      }`}>{i.status}</span>
                    </td>
                    <td className="px-4 py-2 flex gap-1">
                      <button
                        data-testid={`resolve-${i.incident_id}`}
                        onClick={() => update(i.incident_id, { status: "resolved" })}
                        className="p-1.5 rounded hover:bg-ind_green/10 text-ind_green"
                        title="Resolve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        data-testid={`flag-${i.incident_id}`}
                        onClick={() => update(i.incident_id, { status: "flagged" })}
                        className="p-1.5 rounded hover:bg-canvas text-muted"
                        title="Flag"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && !loading && (
                  <tr><td colSpan={5} className="text-center px-4 py-8 text-muted text-xs">No incidents.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <GovFooter />
    </div>
  );
}
