import React from 'react';

export default function SiteHeader({ active = 'home' }) {
  const isHome = active === 'home';
  const isBuild = active === 'build';
  const isCompare = active === 'compare';

  return (
    <header className="border-b border-white/10 bg-black/45 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-400 text-xl font-black text-black shadow-[0_0_25px_rgba(52,211,153,0.35)]">
            C
          </div>
          <div>
            <div className="text-xl font-black tracking-wide">
              PC MAKER <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">BD</span>
            </div>
            <div className="text-xs uppercase tracking-[4px] text-gray-400">Bangladesh PC Builder</div>
          </div>
        </a>

        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-400 md:gap-8">
          <a href="/" className={isHome ? 'border-b-2 border-cyan-500 pb-1 text-white' : 'transition hover:text-white'}>
            Home
          </a>
          <a href="/configurator" className={isBuild ? 'border-b-2 border-cyan-500 pb-1 text-white' : 'transition hover:text-white'}>
            Build PC
          </a>
          <a href="/comparison-results" className={isCompare ? 'border-b-2 border-cyan-500 pb-1 text-white' : 'transition hover:text-white'}>
            Compare
          </a>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          {isHome && (
            <a href="/configurator" className="rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 px-5 py-3 text-sm font-bold text-black transition hover:scale-105">
              Start Building
            </a>
          )}
          {isBuild && (
            <>
              <a href="/" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/5">
                Home
              </a>
              <a href="/comparison-results" className="rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 px-5 py-3 text-sm font-bold text-black transition hover:scale-105">
                Compare
              </a>
            </>
          )}
          {isCompare && (
            <>
              <a href="/" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/5">
                Home
              </a>
              <a href="/configurator" className="rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 px-5 py-3 text-sm font-bold text-black transition hover:scale-105">
                Build PC
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
