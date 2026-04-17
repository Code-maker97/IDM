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
    { role: "ai", text: "Hi, I'm Aegis. Ask me anything about staying safer on the move." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { session_id: sessionId, message: text });
      setMessages((m) => [...m, { role: "ai", text: res.data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: "I couldn't reach the AI right now. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" data-testid="ai-chat-panel">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-zinc-950 sm:rounded-3xl rounded-t-3xl border border-zinc-800 flex flex-col slide-up">
        <header className="flex items-center justify-between p-4 border-b border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm">Aegis · AI Guardian</div>
              <div className="text-[10px] font-mono text-zinc-500">gemini-3-flash</div>
            </div>
          </div>
          <button data-testid="close-chat-btn" onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-zinc-100 text-black rounded-br-md"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {STARTER.map((s, i) => (
              <button
                key={i}
                data-testid={`chat-starter-${i}`}
                onClick={() => send(s)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-600 text-zinc-400"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-3 border-t border-zinc-900 flex items-center gap-2"
        >
          <input
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aegis anything…"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500"
          />
          <button
            data-testid="chat-send-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
