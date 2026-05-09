import Head from 'next/head';
import Image from 'next/image';
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

export default function HomePage() {
  return (
    <>
      <Head>
        <title>PC Bottleneck Checker</title>
        <meta name="description" content="Check bottlenecks, compatibility, and performance for global PC parts and laptops." />
      </Head>

      <div className="min-h-screen bg-[#020406] text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(0,140,255,0.34),transparent_18%),radial-gradient(circle_at_85%_78%,rgba(80,255,150,0.24),transparent_18%),radial-gradient(circle_at_72%_16%,rgba(0,220,255,0.16),transparent_20%),linear-gradient(to_bottom,#010204,#020406_46%,#010101)]" />
        <div className="fixed left-0 top-24 h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-300/55 to-transparent blur-sm" />
        <div className="fixed inset-x-0 bottom-0 h-28 bg-[linear-gradient(90deg,rgba(0,140,255,0.20),transparent_24%,transparent_76%,rgba(80,255,150,0.22))] opacity-70" />

        <SiteHeader active="home" />

        <main>
          <section className="mx-auto grid w-full max-w-[1600px] gap-0 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-8">
            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl sm:p-6 lg:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,255,160,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(0,120,255,0.16),transparent_35%)]" />
              <div className="relative z-10">
                <p className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[4px] text-emerald-300">
                  PC Bottleneck Checker
                </p>

                <h1 className="max-w-3xl text-4xl font-black leading-[0.96] md:text-6xl lg:text-[4.7rem]">
                  Build a PC
                  <span className="block bg-gradient-to-r from-blue-500 via-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                    that actually fits.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
                  Compare components, catch compatibility issues, and see live pricing from local retailers in one polished workspace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/configurator"
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-6 py-3.5 font-bold text-black shadow-[0_0_25px_rgba(52,211,153,0.22)] transition hover:scale-[1.02]"
                  >
                    Start Building
                  </a>
                  <a
                    href="/comparison-results"
                    className="rounded-xl border border-white/10 px-6 py-3.5 font-bold transition hover:bg-white/5"
                  >
                    View Comparisons
                  </a>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/25 p-3.5">
                      <div className="text-2xl font-black text-white">{stat.value}</div>
                      <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-[30px] border border-white/10 bg-black/35 shadow-[0_0_50px_rgba(0,180,255,0.12)] lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/10 to-emerald-400/10" />
              <Image
                src="/images/hero-pc.png"
                alt="PC Builder Hero Image"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-md">
                <div className="text-xs uppercase tracking-[4px] text-cyan-300">Live Builder</div>
                <div className="mt-2 text-lg font-bold">Search parts, compare prices, and save the build.</div>
              </div>
            </div>
          </section>

          <section className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-3 lg:px-8">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-white/[0.06]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 text-lg font-black text-black shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                  {feature.icon}
                </div>
                <h2 className="text-2xl font-black">{feature.title}</h2>
                <div className="my-4 h-[2px] w-20 bg-gradient-to-r from-blue-500 to-emerald-400" />
                <p className="text-sm leading-7 text-gray-400">{feature.desc}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}
