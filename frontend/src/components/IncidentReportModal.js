import React, { useState } from "react";
import { X, AlertTriangle, Send, Loader2 } from "lucide-react";
import { api } from "../lib/api";

const CATEGORIES = [
  { key: "harassment", label: "Harassment" },
  { key: "poor_lighting", label: "Poor lighting" },
  { key: "isolated", label: "Isolated area" },
  { key: "theft", label: "Theft / Snatching" },
  { key: "stalking", label: "Stalking" },
  { key: "other", label: "Other" },
];

export default function IncidentReportModal({ myPos, timeOfDay, onClose, onReported }) {
  const [category, setCategory] = useState(null);
  const [severity, setSeverity] = useState(2);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!category || !myPos) return;
    setSubmitting(true);
    try {
      await api.post("/incidents", {
        category, description, lat: myPos[0], lng: myPos[1], severity, time_of_day: timeOfDay,
      });
      onReported && onReported();
      onClose();
    } catch {
      alert("Could not submit. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-end sm:items-center justify-center p-4" style={{ zIndex: 1100 }} data-testid="report-modal">
      <div className="w-full max-w-md bg-white border border-rule rounded-lg shadow-gov slide-up overflow-hidden max-h-[90vh]">
        <div className="h-1 bg-saffron" />
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-4px)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-saffron/15 border border-saffron/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-saffron" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm">Report an incident</div>
                <div className="text-[10px] text-muted">
                  {myPos ? `${myPos[0].toFixed(4)}, ${myPos[1].toFixed(4)}` : "Locating…"}
                </div>
              </div>
            </div>
            <button data-testid="close-report-btn" onClick={onClose} className="p-2 rounded hover:bg-canvas">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="gov-label mb-2">Category</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                data-testid={`category-${c.key}`}
                onClick={() => setCategory(c.key)}
                className={`text-sm py-2.5 rounded border transition-all ${
                  category === c.key
                    ? "bg-navy-700 text-white border-navy-700"
                    : "bg-white border-rule hover:border-navy-700 text-ink"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="gov-label mb-2">Severity</div>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                data-testid={`severity-${s}`}
                onClick={() => setSeverity(s)}
                className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider border ${
                  severity === s
                    ? s === 3 ? "bg-sos text-white border-sos"
                      : s === 2 ? "bg-caution text-white border-caution"
                      : "bg-yellow-500 text-ink border-yellow-500"
                    : "bg-white border-rule text-muted hover:border-navy-700"
                }`}
              >
                {s === 1 ? "Low" : s === 2 ? "Medium" : "High"}
              </button>
            ))}
          </div>

          <div className="gov-label mb-1.5">Description (optional)</div>
          <textarea
            data-testid="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened…"
            rows={3}
            className="gov-input mb-4"
          />

          <button
            data-testid="submit-report-btn"
            disabled={!category || submitting}
            onClick={submit}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit report
          </button>
          <div className="text-[11px] text-muted text-center mt-3">
            Reports help every citizen on this route. Anonymous submission protected.
          </div>
        </div>
      </div>
    </div>
  );
}
