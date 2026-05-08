import Head from "next/head";
import Image from "next/image";

const features = [
  {
    icon: "⚡",
    title: "Smart Compatibility",
    desc: "Checks parts fit together before you buy.",
  },
  {
    icon: "💰",
    title: "Price Intelligence",
    desc: "Track retailer pricing in one place.",
  },
  {
    icon: "🎯",
    title: "Bottleneck Analysis",
    desc: "Spot balance issues before they become problems.",
  },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>PC Maker BD</title>
        <meta
          name="description"
          content="Build, compare, and analyze your dream PC"
        />
      </Head>

      <div className="min-h-screen overflow-hidden bg-[#020406] text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,120,255,0.25),transparent_25%),radial-gradient(circle_at_80%_40%,rgba(16,255,160,0.20),transparent_30%),linear-gradient(to_bottom,#020406,#010101)]" />
        <div className="fixed top-20 right-10 h-[2px] w-96 rotate-[-30deg] bg-gradient-to-r from-blue-500 to-emerald-400 blur-sm opacity-70" />
        <div className="fixed bottom-20 left-10 h-[2px] w-96 rotate-[20deg] bg-gradient-to-r from-blue-500 to-emerald-400 blur-sm opacity-70" />

        <div className="container mx-auto px-6 py-6">
          <div className="rounded-[30px] border border-cyan-500/20 bg-black/40 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl">
            <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5 lg:px-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-400 text-xl font-black text-black shadow-[0_0_25px_rgba(0,255,180,0.35)]">
                  C
                </div>

                <h1 className="text-xl font-black tracking-wide">
                  PC MAKER{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    BD
                  </span>
                </h1>
              </div>

              <div className="hidden items-center gap-8 text-sm font-medium text-gray-400 md:flex">
                <a href="#" className="border-b-2 border-cyan-500 pb-1 text-white">
                  Home
                </a>
                <a href="/configurator" className="transition hover:text-white">
                  Build PC
                </a>
                <a href="/comparison-results" className="transition hover:text-white">
                  Compare
                </a>
              </div>

              <div className="flex items-center gap-4">
                <button className="text-sm font-medium transition hover:text-cyan-400">
                  Login
                </button>
                <button className="rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 px-6 py-3 text-sm font-bold text-black transition hover:scale-105">
                  Sign Up →
                </button>
              </div>
            </nav>

            <section className="grid items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-14">
              <div>
                <p className="mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-sm font-bold uppercase tracking-[4px] text-transparent">
                  PC MAKER BD
                </p>

                <h2 className="mb-6 text-5xl font-black leading-tight md:text-7xl">
                  Next-Gen PC <br />
                  <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    Builder
                  </span>{" "}
                  Experience
                </h2>

                <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-400">
                  Build, compare, and analyze PC parts with live pricing and compatibility checks.
                </p>

                <div className="flex flex-wrap gap-4">
                  <a
                    href="/configurator"
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-8 py-4 font-bold text-white shadow-[0_0_25px_rgba(0,255,180,0.25)] transition hover:scale-105"
                  >
                    Start Building ⚡
                  </a>

                  <a
                    href="/comparison-results"
                    className="rounded-xl border border-white/10 px-8 py-4 font-bold transition hover:bg-white/5"
                  >
                    View Comparisons
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 rounded-[35px] bg-gradient-to-r from-blue-500 to-emerald-400 opacity-20 blur-3xl" />

                <div className="relative h-[450px] overflow-hidden rounded-[30px] border border-cyan-500/20 bg-black/40 shadow-[0_0_60px_rgba(0,180,255,0.15)]">
                  <Image
                    src="/images/hero-pc.png"
                    alt="PC Builder Hero Image"
                    fill
                    priority
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-emerald-500/10" />
                  <div className="absolute bottom-6 left-10 right-10 h-4 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 shadow-[0_0_30px_rgba(16,255,180,0.45)]" />
                </div>
              </div>
            </section>

            <section className="grid gap-6 px-6 pb-20 md:grid-cols-3 lg:px-14">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition duration-300 hover:border-cyan-500/40 hover:bg-white/10"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 text-2xl text-black shadow-[0_0_20px_rgba(0,255,180,0.25)]">
                    {feature.icon}
                  </div>

                  <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                  <div className="mb-4 h-[2px] w-16 bg-gradient-to-r from-blue-500 to-emerald-400" />
                  <p className="text-sm leading-relaxed text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </section>

            <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
              © {new Date().getFullYear()}{" "}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text font-bold text-transparent">
                PC Maker BD
              </span>
              . Engineering the perfect build.
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
