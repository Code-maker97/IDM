import React from "react";
import { Shield, MapPin, Siren, MessageCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../App";
import { Navigate } from "react-router-dom";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function startLogin() {
  const redirectUrl = window.location.origin + "/app";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}

const BG_IMG =
  "https://static.prod-images.emergentagent.com/jobs/cbb35034-fbd1-4812-a2d2-e1269305a848/images/b793fc9ea8d16777d85ca8203ca682be74dca7f54defd57a7c51b56ec6f95009.png";

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-base text-zinc-100">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${BG_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.45) saturate(0.8)",
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-base/70 via-base/50 to-base" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-zinc-100" strokeWidth={2.2} />
          <span className="font-heading font-bold text-lg tracking-tight">AEGIS</span>
        </div>
        <button
          data-testid="login-nav-button"
          onClick={startLogin}
          className="text-xs font-heading uppercase tracking-[0.2em] px-4 py-2 border border-zinc-700 hover:border-zinc-400 transition-colors rounded-full"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 sm:px-10 pt-10 sm:pt-20 max-w-3xl">
        <div className="text-xs font-heading uppercase tracking-[0.3em] text-zinc-400 mb-6 flex items-center gap-3">
          <span className="inline-block w-8 h-px bg-zinc-500" />
          Safe navigation, reimagined
        </div>
        <h1 className="font-heading text-5xl sm:text-7xl font-bold leading-[0.95] tracking-tight mb-6">
          Walk with<br />
          <span className="text-zinc-400">quiet</span> confidence.
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
          Aegis analyzes lighting, reported incidents, and crowd density in real time
          to recommend the <span className="text-zinc-100">safest</span> route —
          day or night. One-tap SOS shares your live location with trusted contacts.
        </p>

        <button
          data-testid="get-started-btn"
          onClick={startLogin}
          className="group inline-flex items-center gap-3 bg-white text-black font-heading font-semibold px-7 py-4 rounded-full hover:bg-zinc-200 transition-all"
        >
          Get started with Google
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="text-xs text-zinc-500 mt-4 font-mono">
          Free · No app install required · Works on any phone
        </div>
      </main>

      {/* Feature strip */}
      <section className="relative z-10 px-6 sm:px-10 mt-24 sm:mt-32 pb-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: MapPin, label: "Safe routing", desc: "Dynamic scoring across incidents, lighting & crowd." },
            { icon: Siren, label: "One-tap SOS", desc: "Live location fired off to every trusted contact." },
            { icon: Shield, label: "Crowd-sourced", desc: "Community reports make every traveler safer." },
            { icon: MessageCircle, label: "AI assistant", desc: "Aegis chat guides you when things feel off." },
          ].map(({ icon: Icon, label, desc }, i) => (
            <div
              key={i}
              className="border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm p-5 rounded-2xl hover:border-zinc-600 hover:-translate-y-1 transition-all"
            >
              <Icon className="w-5 h-5 text-zinc-300 mb-4" strokeWidth={2} />
              <div className="font-heading font-semibold text-sm mb-1">{label}</div>
              <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="text-xs text-zinc-600 font-mono">© 2026 Aegis · Built with care</div>
        <div className="text-xs text-zinc-600 font-heading uppercase tracking-[0.2em]">v1.0</div>
      </footer>
    </div>
  );
}
