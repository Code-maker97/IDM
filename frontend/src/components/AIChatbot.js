import React, { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Shield } from "lucide-react";
import { api } from "../lib/api";

const STARTER = [
  "What should I do if I'm being followed?",
  "Is it safe to walk home at 11pm?",
  "How do I travel safe by auto?",
];

export default function AIChatbot({ onClose }) {
  const [sessionId] = useState(() => "chat_" + Math.random().toString(36).slice(2, 12));
  const [messages, setMessages] = useState([
    { role: "ai", text: "Namaste. I'm Aegis, the SurakshitPath safety assistant. Ask me anything about staying safer on the move." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { session_id: sessionId, message: text });
      setMessages((m) => [...m, { role: "ai", text: res.data.reply }]);
    } catch (error) {
      console.error("Chat request failed:", error);
      setMessages((m) => [...m, { role: "ai", text: "I couldn't reach the AI right now. Try again in a moment." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 1100 }} data-testid="ai-chat-panel">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white sm:rounded-lg rounded-t-lg border border-rule flex flex-col slide-up shadow-gov overflow-hidden">
        <div className="h-1 bg-navy-700" />
        <header className="flex items-center justify-between p-4 border-b border-rule bg-canvas">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-navy-50 border border-navy-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-navy-700" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm">Aegis · AI Guardian</div>
              <div className="text-[10px] font-mono text-muted">gemini-3-flash · powered by SurakshitPath</div>
            </div>
          </div>
          <button data-testid="close-chat-btn" onClick={onClose} className="p-2 rounded hover:bg-rule/30">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white" data-testid="chat-messages">
          {messages.map((m, i) => (
            <div key={`${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-navy-700 text-white rounded-br-sm"
                    : "bg-canvas border border-rule text-ink rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-lg bg-canvas border border-rule">
                <Loader2 className="w-4 h-4 animate-spin text-navy-700" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {STARTER.map((s) => (
              <button
                key={s}
                data-testid={`chat-starter-${s.slice(0, 20)}`}
                onClick={() => send(s)}
                className="text-[11px] px-3 py-1.5 rounded border border-rule hover:border-navy-700 text-muted bg-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-3 border-t border-rule bg-canvas flex items-center gap-2"
        >
          <input
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aegis anything…"
            className="gov-input flex-1"
          />
          <button
            data-testid="chat-send-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded bg-navy-700 hover:bg-navy-800 text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
