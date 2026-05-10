import React from 'react';

export default function SiteHeader({ active = 'home' }) {
  const isHome = active === 'home';
  const isBuild = active === 'build';
  const isCompare = active === 'compare';

  return (
    <header className="border-b border-sky-400/10 bg-[#030917]/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-[linear-gradient(145deg,#60a5fa,#1d4ed8)] text-xl font-black text-white shadow-[0_0_28px_rgba(37,99,235,0.35)]">
            P
          </div>
          <div>
            <div className="text-xl font-black tracking-[0.12em] text-slate-100">
              PC BOTTLENECK <span className="bg-gradient-to-r from-sky-200 via-sky-400 to-blue-500 bg-clip-text text-transparent">CHECKER</span>
            </div>
            <div className="text-xs uppercase tracking-[4px] text-slate-500">Global Bottleneck Analyzer</div>
          </div>
        </a>

        <nav className="flex flex-wrap items-center gap-3 rounded-full border border-slate-800/90 bg-slate-950/55 px-2 py-2 text-sm font-medium text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] md:gap-3">
          <a href="/" className={isHome ? 'rounded-full bg-sky-500/15 px-4 py-2 text-sky-100' : 'rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-slate-100'}>
            Home
          </a>
          <a href="/configurator" className={isBuild ? 'rounded-full bg-sky-500/15 px-4 py-2 text-sky-100' : 'rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-slate-100'}>
            Build PC
          </a>
          <a href="/comparison-results" className={isCompare ? 'rounded-full bg-sky-500/15 px-4 py-2 text-sky-100' : 'rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-slate-100'}>
            Compare
          </a>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          {isHome && (
            <a href="/configurator" className="primary-glow-button rounded-2xl px-5 py-3 text-sm font-bold transition hover:translate-y-[-1px]">
              Start Building
            </a>
          )}
          {isBuild && (
            <>
              <a href="/" className="secondary-glow-button rounded-2xl px-4 py-3 text-sm font-semibold transition hover:border-sky-300/20 hover:bg-sky-400/5">
                Home
              </a>
              <a href="/comparison-results" className="primary-glow-button rounded-2xl px-5 py-3 text-sm font-bold transition hover:translate-y-[-1px]">
                Compare
              </a>
            </>
          )}
          {isCompare && (
            <>
              <a href="/" className="secondary-glow-button rounded-2xl px-4 py-3 text-sm font-semibold transition hover:border-sky-300/20 hover:bg-sky-400/5">
                Home
              </a>
              <a href="/configurator" className="primary-glow-button rounded-2xl px-5 py-3 text-sm font-bold transition hover:translate-y-[-1px]">
                Build PC
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
