import Head from 'next/head';
import SiteHeader from '../components/SiteHeader';

const features = [
  {
    icon: '01',
    title: 'Smart Compatibility',
    desc: 'Checks parts fit together before you buy.',
  },
  {
    icon: '02',
    title: 'Price Intelligence',
    desc: 'Track retailer pricing in one place.',
  },
  {
    icon: '03',
    title: 'Bottleneck Analysis',
    desc: 'Spot balance issues before they become problems.',
  },
];

const stats = [
  { value: 'Live', label: 'pricing updates' },
  { value: '3+', label: 'retailers tracked' },
  { value: 'Fast', label: 'build analysis' },
];

const quickActions = [
  {
    eyebrow: '01',
    title: 'Start a build',
    desc: 'Open the configurator and stack parts with live pricing.',
    href: '/configurator#select-components',
  },
  {
    eyebrow: '02',
    title: 'Compare prices',
    desc: 'Scan retailer rows and spot the best value instantly.',
    href: '/comparison-results',
  },
  {
    eyebrow: '03',
    title: 'Check a product',
    desc: 'Jump into a product page for details and bottleneck fit.',
    href: '/products/1',
  },
  {
    eyebrow: '04',
    title: 'Review balance',
    desc: 'Use the performance meter to sanity-check the whole build.',
    href: '/configurator#build-summary',
  },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>PC Bottleneck Checker</title>
        <meta name="description" content="Check bottlenecks, compatibility, and performance for global PC parts and laptops." />
      </Head>

      <div className="min-h-screen bg-[#020406] text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(59,130,246,0.32),transparent_18%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.18),transparent_20%),radial-gradient(circle_at_50%_92%,rgba(29,78,216,0.28),transparent_26%),linear-gradient(to_bottom,#020611,#020817_48%,#01030a)]" />
        <div className="fixed left-0 top-24 h-[2px] w-full bg-gradient-to-r from-transparent via-sky-300/55 to-transparent blur-sm" />
        <div className="fixed inset-x-0 bottom-0 h-28 bg-[linear-gradient(90deg,rgba(37,99,235,0.20),transparent_24%,transparent_76%,rgba(56,189,248,0.20))] opacity-80" />

        <SiteHeader active="home" />

        <main>
          <section className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <div className="surface-shell relative overflow-hidden rounded-[30px] p-5 sm:p-6 lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(30,64,175,0.22),transparent_34%)]" />
              <div className="absolute right-[-12%] top-[-14%] h-40 w-40 rounded-full bg-sky-400/12 blur-3xl" />
              <div className="absolute bottom-[-16%] left-[-10%] h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />
              <div className="relative z-10">
                <p className="blue-badge mb-3 inline-flex rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[4px]">
                  PC Bottleneck Checker
                </p>

                <h1 className="max-w-3xl text-3xl font-black leading-[0.94] text-slate-50 md:text-5xl lg:text-[4rem]">
                  Build a machine
                  <span className="block bg-gradient-to-r from-sky-100 via-sky-400 to-blue-600 bg-clip-text text-transparent">
                    with electric balance.
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-[15px]">
                  Compare components, catch compatibility issues, and keep the whole build inside a tighter blue command surface that feels fast to scan.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="/configurator"
                    className="primary-glow-button rounded-2xl px-5 py-3 font-bold transition hover:translate-y-[-1px]"
                  >
                    Start Building
                  </a>
                  <a
                    href="/comparison-results"
                    className="secondary-glow-button rounded-2xl px-5 py-3 font-bold transition hover:border-sky-300/20 hover:bg-sky-500/5"
                  >
                    View Comparisons
                  </a>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="blue-stat-card rounded-2xl p-3">
                      <div className="text-xl font-black text-slate-50">{stat.value}</div>
                      <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="surface-shell overflow-hidden rounded-[30px] p-5 sm:p-6 lg:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="blue-badge inline-flex rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[4px]">
                    Quick Options
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-slate-50">Pick a path and move fast.</h2>
                </div>
                <div className="rounded-2xl border border-sky-400/18 bg-[#071122]/78 px-4 py-3 text-right">
                  <div className="text-[10px] uppercase tracking-[3px] text-slate-500">Best Flow</div>
                  <div className="mt-1 text-sm font-semibold text-sky-200">Build, compare, inspect.</div>
                </div>
              </div>

              <div className="grid gap-3">
                {quickActions.map((action) => (
                  <a
                    key={action.title}
                    href={action.href}
                    className="group rounded-[24px] border border-slate-700/70 bg-[#071121]/82 p-4 transition hover:border-sky-400/30 hover:bg-[#09162b]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[4px] text-sky-300">{action.eyebrow}</div>
                        <div className="mt-2 text-lg font-bold text-slate-50">{action.title}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{action.desc}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100 transition group-hover:bg-sky-400/15">
                        Open
                      </span>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-700/70 bg-[#050c1b]/80 p-4">
                  <div className="text-[10px] uppercase tracking-[3px] text-slate-500">Live Data</div>
                  <div className="mt-2 text-lg font-bold text-white">SQLite-backed parts</div>
                </div>
                <div className="rounded-2xl border border-slate-700/70 bg-[#050c1b]/80 p-4">
                  <div className="text-[10px] uppercase tracking-[3px] text-slate-500">Layout</div>
                  <div className="mt-2 text-lg font-bold text-white">Compact and readable</div>
                </div>
                <div className="rounded-2xl border border-slate-700/70 bg-[#050c1b]/80 p-4">
                  <div className="text-[10px] uppercase tracking-[3px] text-slate-500">Theme</div>
                  <div className="mt-2 text-lg font-bold text-white">Black with electric blue</div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto grid w-full max-w-[1120px] gap-4 px-4 pb-10 sm:px-6 md:grid-cols-2 lg:px-8 xl:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="surface-shell group rounded-[26px] p-4 transition hover:-translate-y-1 hover:border-sky-400/30"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#93c5fd,#2563eb)] text-sm font-black text-white shadow-[0_0_24px_rgba(37,99,235,0.26)]">
                  {feature.icon}
                </div>
                <h2 className="text-lg font-black text-slate-50">{feature.title}</h2>
                <div className="my-3 h-[2px] w-14 bg-gradient-to-r from-sky-300 to-blue-600" />
                <p className="text-sm leading-7 text-slate-400">{feature.desc}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}
