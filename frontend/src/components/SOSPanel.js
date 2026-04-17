import React, { useEffect, useState } from "react";
import { X, Siren, Phone, CheckCircle2, AlertCircle, Loader2, MapPin } from "lucide-react";
import { api } from "../lib/api";

export default function SOSPanel({ myPos, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/contacts");
        setContacts(res.data.contacts || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const trigger = async () => {
    if (!myPos) {
      alert("Location not available yet.");
      return;
    }
    setSending(true);
    try {
      const res = await api.post("/sos/trigger", {
        lat: myPos[0],
        lng: myPos[1],
        message: "Emergency! I need help.",
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
      setResult({ error: e?.response?.data?.detail || "Failed to send SOS" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      data-testid="sos-panel-overlay"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-red-900/60 rounded-3xl p-6 slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="font-heading font-bold text-lg">Emergency SOS</div>
              <div className="text-xs text-zinc-500">Alerts trusted contacts with live location</div>
            </div>
          </div>
          <button data-testid="close-sos-btn" onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location */}
        <div className="border border-zinc-800 rounded-xl p-3 mb-4 flex items-center gap-3">
          <MapPin className="w-4 h-4 text-blue-400" />
          <div className="flex-1 text-xs font-mono text-zinc-300">
            {myPos ? `${myPos[0].toFixed(5)}, ${myPos[1].toFixed(5)}` : "Locating…"}
          </div>
        </div>

        {/* Contacts */}
        <div className="mb-5">
          <div className="text-[10px] font-heading uppercase tracking-[0.3em] text-zinc-500 mb-2">
            {loading ? "Loading contacts…" : `${contacts.length} trusted contact${contacts.length === 1 ? "" : "s"}`}
          </div>
          {!loading && contacts.length === 0 && (
            <div className="border border-amber-900/60 bg-amber-950/20 rounded-xl p-3 text-xs text-amber-300">
              No contacts yet. Add trusted contacts first — SOS still logs your alert.
            </div>
          )}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {contacts.map((c) => (
              <div key={c.contact_id} className="flex items-center gap-3 border border-zinc-800 rounded-xl p-2.5">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <div className="flex-1">
                  <div className="text-sm">{c.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">{c.phone}</div>
                </div>
                {c.relation && (
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{c.relation}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        {!result && (
          <button
            data-testid="confirm-sos-btn"
            onClick={trigger}
            disabled={sending}
            className="w-full bg-red-500 text-white font-heading font-bold text-lg py-4 rounded-full hover:bg-red-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Siren className="w-5 h-5" />}
            {sending ? "Sending alerts…" : "Send SOS now"}
          </button>
        )}

        {/* Result */}
        {result && !result.error && (
          <div data-testid="sos-result-success" className="border border-emerald-900/60 bg-emerald-950/25 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-heading font-bold">SOS dispatched</span>
            </div>
            <div className="text-xs text-zinc-300 mb-1">
              {result.contacts_notified} contact{result.contacts_notified === 1 ? "" : "s"} notified
              {result.simulated ? " (simulation mode — add Twilio keys for real SMS)" : ""}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono break-all">{result.maps_url}</div>
            <button
              onClick={onClose}
              className="w-full mt-3 border border-zinc-700 rounded-full py-2 text-xs font-heading uppercase tracking-[0.2em] hover:border-zinc-500"
            >
              Close
            </button>
          </div>
        )}
        {result?.error && (
          <div data-testid="sos-result-error" className="border border-red-900/60 bg-red-950/30 rounded-xl p-4 flex items-center gap-2 text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{result.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
