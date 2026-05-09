import React from "react";
import { Shield, Siren, MapPin, MessageCircle, Users, AlertTriangle, ArrowRight, FileText, Phone, Play } from "lucide-react";
import { useAuth } from "../App";
import { Navigate, useNavigate } from "react-router-dom";
import { Masthead, GovFooter } from "../components/GovChrome";

const SCHEMES = [
  { icon: MapPin, label: "Safe-Route Navigation", desc: "Walk routes scored by lighting, crowd & incident density." },
  { icon: Siren, label: "Emergency SOS", desc: "One-tap alert with live location to trusted contacts." },
  { icon: AlertTriangle, label: "Incident Reporting", desc: "Crowdsource hazards — make every traveler safer." },
  { icon: MessageCircle, label: "AI Safety Assistant", desc: "Government-curated guidance, available 24×7." },
  { icon: Users, label: "Trusted Contacts", desc: "Add family members for instant SMS alerts." },
  { icon: Shield, label: "Admin Dashboard", desc: "Visualisation for civic bodies & police partners." },
];

const STATS = [
  { num: "8 cr+", label: "Women & students in urban India" },
  { num: "3.6×", label: "Higher unsafe-route reports after 9 PM" },
  { num: "112", label: "National Emergency Helpline integration" },
  { num: "24×7", label: "Real-time AI risk monitoring" },
];

export default function Landing() {
  const { user, loading, devLogin } = useAuth();
  const navigate = useNavigate();
  if (!loading && user) return <Navigate to="/app" replace />;

  const handleDemoLogin = async () => {
    await devLogin();
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Masthead />

      {/* Notice strip */}
      <div className="bg-saffron/15 border-b border-saffron/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 text-[12px] flex items-start sm:items-center gap-2">
          <span className="stamp shrink-0">PROTOTYPE</span>
          <span>
            <strong>Notice:</strong> Working prototype submitted for BGI Hackathon 2026 by Team Innovaters.
            Sign in with Google to experience the citizen interface.
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="gov-label mb-4 text-navy-700">Citizen-facing safety initiative</div>
            <h1 className="font-heading text-3xl sm:text-5xl font-bold text-ink leading-[1.05] mb-4">
              Walk safer.
              <br />
              <span className="text-navy-700">Reach home, every time.</span>
            </h1>
            <p className="font-hindi text-navy-700 text-lg sm:text-xl mb-5">सुरक्षित पथ — हर नागरिक का अधिकार।</p>
            <p className="text-muted leading-relaxed text-base mb-6 max-w-xl">
              <strong>SurakshitPath</strong> is an AI-driven safe-route navigation platform for
              women, students, the elderly, and vulnerable urban citizens. It evaluates every walk
              by <em>lighting</em>, <em>crowd density</em>, <em>reported incidents</em>, and time of day —
              and recommends the safest path, not just the shortest.
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                data-testid="get-started-btn"
                onClick={handleDemoLogin}
                className="group inline-flex items-center gap-2.5 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded text-sm shadow-gov transition-colors"
              >
                <Play className="w-4 h-4" />
                Enter Live Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center gap-2 border border-navy-700 text-navy-700 hover:bg-navy-50 font-semibold px-6 py-3 rounded text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                View capabilities
              </a>
              <a
                href="tel:112"
                className="inline-flex items-center gap-2 text-sos hover:underline font-semibold text-sm"
              >
                <Phone className="w-4 h-4" />
                Emergency · dial 112
              </a>
            </div>
          </div>

          {/* Right: official stats card */}
          <div className="gov-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="gov-label">At a glance</div>
              <span className="text-[10px] font-mono text-muted">Source: NCRB & MoSJE briefings</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {STATS.map((s) => (
                <div key={s.num} className="border border-rule p-4 rounded">
                  <div className="font-heading text-3xl text-navy-700 font-bold leading-none">{s.num}</div>
                  <div className="text-[12px] text-muted mt-1.5 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 border border-saffron/50 bg-saffron/10 rounded p-3 text-[12px] flex items-start gap-2">
              <Shield className="w-4 h-4 text-navy-700 shrink-0 mt-0.5" />
              <span>
                Designed for integration with city police FIR portals (e.g., MP Citizen Police),
                municipal CCTV / lighting maps, and the national 112 helpline.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features (gov scheme tile style) */}
      <section id="features" className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">Citizen Services</h2>
          <span className="font-hindi text-muted text-sm hidden sm:block">नागरिक सेवाएँ</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCHEMES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="gov-card scheme-tile p-5">
              <div className="w-10 h-10 rounded bg-navy-50 border border-navy-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-navy-700" strokeWidth={2} />
              </div>
              <div className="font-semibold text-ink text-sm mb-1">{label}</div>
              <div className="text-[12.5px] text-muted leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-baseline justify-between gap-4 mb-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">How it works</h2>
            <span className="font-hindi text-muted text-sm hidden sm:block">यह कैसे काम करता है</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Sign in", d: "Citizen logs in securely with verified Google account." },
              { n: "02", t: "Plan", d: "Enter destination — AI computes safest path using live data." },
              { n: "03", t: "Travel", d: "Follow route. Report any hazard with one tap on the map." },
              { n: "04", t: "Alert", d: "If unsafe — SOS pings every trusted contact with live GPS." },
            ].map((s) => (
              <div key={s.n} className="border-l-4 border-navy-700 pl-4 py-1">
                <div className="font-mono text-saffron text-sm font-bold">{s.n}</div>
                <div className="font-semibold mt-1">{s.t}</div>
                <div className="text-[12.5px] text-muted leading-relaxed mt-1">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Acknowledgements */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="gov-card p-5 sm:p-6">
          <div className="gov-label mb-2">Research & Data Sources</div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] text-muted list-disc pl-5">
            <li>Urban safety studies — spatial data for human-centric navigation</li>
            <li>Public crime portals (e.g., MP Citizen Police FIR records)</li>
            <li>OpenStreetMap & OSRM routing — open city-level data</li>
            <li>AI/ML risk-assessment models for dynamic scoring</li>
            <li>National 112 Emergency Response Support System</li>
            <li>Municipal CCTV / lighting / crowd density maps</li>
          </ul>
        </div>
      </section>

      <GovFooter />
    </div>
  );
}
