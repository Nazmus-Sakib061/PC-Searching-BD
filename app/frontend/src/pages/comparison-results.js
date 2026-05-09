import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SiteHeader from '../components/SiteHeader';

function ComparisonResultsPage() {
  const router = useRouter();
  const [comparisonData, setComparisonData] = useState([]);
  const [retailerNames, setRetailerNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/comparison-data');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load comparison data.');
        }

        setComparisonData(data.items || []);
        setRetailerNames(data.retailerNames || []);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError(err.message || 'Failed to load comparison data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pageTitle = 'Global PC Parts - PC Bottleneck Checker';
  const pageDescription = 'Compare real PC parts and laptops from a global catalog.';
  const clampStyle = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/configurator');
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
      </Head>

      <div className="min-h-screen bg-[#020406] text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,120,255,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(16,255,160,0.14),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(0,180,255,0.12),transparent_30%),linear-gradient(to_bottom,#020406,#010101)]" />
        <SiteHeader active="compare" />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl md:p-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[4px] text-emerald-300">
                  Price Comparison
                </p>
                <h1 className="mt-4 text-4xl font-black leading-[0.95] md:text-6xl">
                  Compare components across retailers.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-gray-300">
                  Live pricing pulled from SQLite, arranged in a wide comparison surface that fills the page.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/35 px-5 py-4 text-sm text-gray-300">
                View prices by component and spot the best retailer at a glance.
              </div>
            </div>

            {loading && <p className="my-8 text-center text-lg text-gray-300">Loading comparisons...</p>}
            {error && <p className="my-8 text-center text-lg text-red-400">{error}</p>}

            {!loading && !error && comparisonData.length === 0 && (
              <p className="my-8 text-center text-lg text-gray-300">No comparison data available at the moment.</p>
            )}

            {!loading && !error && comparisonData.length > 0 && (
              <div className="overflow-x-auto rounded-[28px] border border-white/10">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="border-b border-white/10 px-4 py-4 font-semibold">Component</th>
                      <th className="border-b border-white/10 px-4 py-4 font-semibold">Category</th>
                      <th className="border-b border-white/10 px-4 py-4 font-semibold">Specifications</th>
                      {retailerNames.map((retailerName) => (
                        <th
                          key={retailerName}
                          className="border-b border-white/10 px-4 py-4 text-center font-semibold"
                        >
                          {retailerName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white/0' : 'bg-white/[0.03]'}>
                        <td className="border-b border-white/10 px-4 py-4 font-medium text-white" style={clampStyle}>
                          {item.display_name || item.component}
                        </td>
                        <td className="border-b border-white/10 px-4 py-4 text-gray-300">{item.category}</td>
                        <td className="border-b border-white/10 px-4 py-4 text-gray-300" style={clampStyle}>
                          {item.specs || '-'}
                        </td>
                        {retailerNames.map((retailerName) => {
                          const retailerData = item.retailers.find((r) => r.name === retailerName);
                          return (
                            <td key={retailerName} className="border-b border-white/10 px-4 py-4 text-center">
                              {retailerData ? (
                                <a
                                  href={retailerData.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                className="font-semibold text-emerald-300 hover:text-emerald-200 hover:underline"
                              >
                                  ${Number(retailerData.price || 0).toLocaleString()}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
              >
                Back
              </button>
              <a
                href="/configurator"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:scale-105"
              >
                Go to Configurator
              </a>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default ComparisonResultsPage;
