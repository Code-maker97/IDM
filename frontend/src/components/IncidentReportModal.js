import React, { useState } from "react";
import { X, AlertTriangle, Send, Loader2 } from "lucide-react";
import { api } from "../lib/api";

const CATEGORIES = [
  { key: "harassment", label: "Harassment" },
  { key: "poor_lighting", label: "Poor lighting" },
  { key: "isolated", label: "Isolated area" },
  { key: "theft", label: "Theft" },
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
        category,
        description,
        lat: myPos[0],
        lng: myPos[1],
        severity,
        time_of_day: timeOfDay,
      });
      onReported && onReported();
      onClose();
    } catch (e) {
      alert("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" data-testid="report-modal">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm">Report an incident</div>
              <div className="text-[10px] text-zinc-500">
                {myPos ? `${myPos[0].toFixed(4)}, ${myPos[1].toFixed(4)}` : "Locating…"}
              </div>
            </div>
          </div>
          <button data-testid="close-report-btn" onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              data-testid={`category-${c.key}`}
              onClick={() => setCategory(c.key)}
              className={`text-sm py-3 rounded-xl border transition-all ${
                category === c.key
                  ? "bg-zinc-100 text-black border-zinc-100"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Severity */}
        <div className="mb-4">
          <div className="text-[10px] font-heading uppercase tracking-[0.3em] text-zinc-500 mb-2">Severity</div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                data-testid={`severity-${s}`}
                onClick={() => setSeverity(s)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-heading uppercase tracking-wider border ${
                  severity === s
                    ? s === 3
                      ? "bg-red-500 text-white border-red-500"
                      : s === 2
                      ? "bg-amber-500 text-black border-amber-500"
                      : "bg-yellow-400 text-black border-yellow-400"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {s === 1 ? "Low" : s === 2 ? "Medium" : "High"}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <textarea
          data-testid="report-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened (optional)…"
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-zinc-500 mb-4"
        />

        <button
          data-testid="submit-report-btn"
          disabled={!category || submitting}
          onClick={submit}
          className="w-full bg-white text-black font-heading font-semibold py-3 rounded-full disabled:opacity-40 hover:bg-zinc-200 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit report
        </button>
      </div>
    </div>
  );
}
