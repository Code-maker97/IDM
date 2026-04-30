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
    if (!myPos) { alert("Location not available yet."); return; }
    setSending(true);
    try {
      const res = await api.post("/sos/trigger", {
        lat: myPos[0], lng: myPos[1], message: "Emergency! I need help.",
      });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e?.response?.data?.detail || "Failed to send SOS" });
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" data-testid="sos-panel-overlay">
      <div className="w-full max-w-md bg-white border border-rule rounded-lg slide-up shadow-gov overflow-hidden">
        <div className="h-1 bg-sos" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded bg-sos/10 border border-sos/40 flex items-center justify-center">
                <Siren className="w-5 h-5 text-sos" />
              </div>
              <div>
                <div className="font-heading font-bold text-base">Emergency SOS</div>
                <div className="text-xs text-muted">Alerts trusted contacts with live location</div>
              </div>
            </div>
            <button data-testid="close-sos-btn" onClick={onClose} className="p-2 rounded hover:bg-canvas">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="border border-rule rounded p-3 mb-4 flex items-center gap-3 bg-canvas">
            <MapPin className="w-4 h-4 text-navy-700" />
            <div className="flex-1 text-xs font-mono text-ink">
              {myPos ? `${myPos[0].toFixed(5)}, ${myPos[1].toFixed(5)}` : "Locating…"}
            </div>
            <a
              className="text-[11px] text-navy-700 hover:underline font-semibold"
              href={myPos ? `https://maps.google.com/?q=${myPos[0]},${myPos[1]}` : "#"}
              target="_blank"
              rel="noreferrer"
            >
              View
            </a>
          </div>

          <div className="mb-4">
            <div className="gov-label mb-2">
              {loading ? "Loading contacts…" : `${contacts.length} trusted contact${contacts.length === 1 ? "" : "s"}`}
            </div>
            {!loading && contacts.length === 0 && (
              <div className="border border-saffron/50 bg-saffron/15 rounded p-3 text-xs text-ink">
                No contacts yet. SOS still logs the alert and shows location to authorities.
              </div>
            )}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {contacts.map((c) => (
                <div key={c.contact_id} className="flex items-center gap-3 border border-rule rounded p-2.5 bg-canvas">
                  <Phone className="w-3.5 h-3.5 text-navy-700" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-[11px] text-muted font-mono">{c.phone}</div>
                  </div>
                  {c.relation && (
                    <div className="text-[10px] uppercase tracking-wider text-muted">{c.relation}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!result && (
            <button
              data-testid="confirm-sos-btn"
              onClick={trigger}
              disabled={sending}
              className="w-full bg-sos hover:bg-sos/90 text-white font-bold text-base py-3.5 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Siren className="w-5 h-5" />}
              {sending ? "Sending alerts…" : "SEND SOS NOW"}
            </button>
          )}

          {result && !result.error && (
            <div data-testid="sos-result-success" className="border border-ind_green/40 bg-ind_green/10 rounded p-4">
              <div className="flex items-center gap-2 mb-2 text-ind_green">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-heading font-bold">SOS dispatched</span>
              </div>
              <div className="text-xs text-ink mb-1">
                {result.contacts_notified} contact{result.contacts_notified === 1 ? "" : "s"} notified
                {result.simulated ? " — simulation mode" : ""}
              </div>
              <div className="text-[11px] text-muted font-mono break-all">{result.maps_url}</div>
              <button
                onClick={onClose}
                className="w-full mt-3 border border-rule rounded py-2 text-xs font-semibold uppercase tracking-wider hover:border-navy-700"
              >
                Close
              </button>
            </div>
          )}
          {result?.error && (
            <div data-testid="sos-result-error" className="border border-sos/50 bg-sos/10 rounded p-4 flex items-center gap-2 text-sos">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{result.error}</span>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-rule text-[11px] text-muted text-center">
            For immediate police assistance, dial <a href="tel:112" className="text-sos font-bold">112</a> · Women helpline <a href="tel:1091" className="text-sos font-bold">1091</a>
          </div>
        </div>
      </div>
    </div>
  );
}
