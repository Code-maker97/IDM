import React from "react";

export function Tricolor() {
  return (
    <div className="tricolor" aria-hidden="true">
      <span /><span /><span />
    </div>
  );
}

export function Masthead({ subPage }) {
  return (
    <>
      <Tricolor />
      <div className="bg-navy-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between text-[11px] font-medium">
          <div className="flex items-center gap-3">
            <span className="font-hindi">भारत सरकार</span>
            <span className="opacity-70">|</span>
            <span>Government of India · Smart Cities Mission</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 opacity-90">
            <a href="#" className="hover:underline">Skip to content</a>
            <span>|</span>
            <span>A+ A A−</span>
            <span>|</span>
            <span>EN · हिन्दी</span>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <span className="chakra shrink-0" aria-label="Ashoka Chakra" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
              <span className="font-heading font-bold text-navy-700 text-xl sm:text-2xl tracking-tight">
                SurakshitPath
              </span>
              <span className="font-hindi text-navy-700 text-base sm:text-lg">सुरक्षित पथ</span>
            </div>
            <div className="text-[11px] text-muted leading-tight">
              Intelligent Safe-Route Navigation System for Women & Vulnerable Groups
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end text-right shrink-0">
            <div className="gov-label text-navy-700">An initiative under</div>
            <div className="text-xs font-semibold text-ink">BGI Hackathon 2026</div>
            <div className="text-[10px] text-muted font-mono">Problem ID · IT3P2 · Team #1467</div>
          </div>
        </div>
        {subPage && (
          <div className="border-t border-rule bg-canvas">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 text-[11px] text-muted">
              <span className="text-navy-700 font-semibold">Home</span>
              <span className="mx-2">›</span>
              <span>{subPage}</span>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export function GovFooter() {
  return (
    <footer className="border-t border-rule bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted">
        <div>
          <div className="gov-label mb-1.5">Submitted by</div>
          <div className="text-ink font-semibold">Team Innovaters</div>
          <div>Team ID · 1467</div>
          <div>Problem Statement ID · IT3P2</div>
        </div>
        <div>
          <div className="gov-label mb-1.5">Theme</div>
          <div className="text-ink">Smart Cities & Urban Innovation</div>
          <div>Disaster Management</div>
          <div className="font-mono mt-1">Software · Optional Hardware</div>
        </div>
        <div>
          <div className="gov-label mb-1.5">Disclaimer</div>
          <div className="leading-relaxed">
            This is a working prototype submitted for the BGI Hackathon 2026.
            It is not yet officially endorsed by any government department.
          </div>
        </div>
      </div>
      <Tricolor />
    </footer>
  );
}
