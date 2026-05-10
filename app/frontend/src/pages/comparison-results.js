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
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(29,78,216,0.14),transparent_30%),linear-gradient(to_bottom,#020611,#01030a)]" />
        <SiteHeader active="compare" />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <section className="surface-shell rounded-[34px] p-5 md:p-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="blue-badge inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[4px]">
                  Price Comparison
                </p>
                <h1 className="mt-4 text-4xl font-black leading-[0.95] text-slate-50 md:text-6xl">
                  Compare components across retailers.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                  Live pricing pulled from SQLite, arranged in a wide comparison surface that fills the page.
                </p>
              </div>
              <div className="blue-stat-card rounded-3xl px-5 py-4 text-sm text-slate-300">
                View prices by component and spot the best retailer at a glance.
              </div>
            </div>

            {loading && <p className="my-8 text-center text-lg text-gray-300">Loading comparisons...</p>}
            {error && <p className="my-8 text-center text-lg text-red-400">{error}</p>}

            {!loading && !error && comparisonData.length === 0 && (
              <p className="my-8 text-center text-lg text-gray-300">No comparison data available at the moment.</p>
            )}

            {!loading && !error && comparisonData.length > 0 && (
              <div className="custom-scrollbar overflow-x-auto rounded-[28px] border border-slate-700/70 bg-[#040a19]/70">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-sky-400/7">
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
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white/0' : 'bg-sky-400/[0.03]'}>
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
                                className="font-semibold text-sky-300 hover:text-sky-200 hover:underline"
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
                className="secondary-glow-button rounded-2xl px-5 py-3 text-sm font-semibold transition hover:border-sky-300/20 hover:bg-sky-500/5"
              >
                Back to Configurator
              </button>
              <a
                href="/configurator"
                className="primary-glow-button rounded-2xl px-5 py-3 text-sm font-semibold transition hover:translate-y-[-1px]"
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
