import React, { useState, useEffect } from 'react';
import Head from 'next/head';

function ComparisonResultsPage() {
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

  const pageTitle = 'Component Price Comparison - PC Maker BD';
  const pageDescription = 'Compare live prices of PC components from local retailers.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
      </Head>

      <div className="min-h-screen bg-[#020406] px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[4px] text-cyan-400">Price Comparison</p>
              <h1 className="mt-2 text-4xl font-black md:text-5xl">Compare components across retailers</h1>
            </div>
            <div className="text-sm text-gray-400">
              Live pricing pulled from SQLite
            </div>
          </div>

          {loading && <p className="my-8 text-center text-xl">Loading comparisons...</p>}
          {error && <p className="my-8 text-center text-xl text-red-400">{error}</p>}

          {!loading && !error && comparisonData.length === 0 && (
            <p className="my-8 text-center text-xl">No comparison data available at the moment.</p>
          )}

          {!loading && !error && comparisonData.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/5">
                    <th className="border-b border-white/10 px-4 py-3 font-semibold">Component</th>
                    <th className="border-b border-white/10 px-4 py-3 font-semibold">Category</th>
                    <th className="border-b border-white/10 px-4 py-3 font-semibold">Specifications</th>
                    {retailerNames.map((retailerName) => (
                      <th
                        key={retailerName}
                        className="border-b border-white/10 px-4 py-3 text-center font-semibold"
                      >
                        {retailerName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white/0' : 'bg-white/[0.03]'}>
                      <td className="border-b border-white/10 px-4 py-4 font-medium">{item.component}</td>
                      <td className="border-b border-white/10 px-4 py-4 text-gray-300">{item.category}</td>
                      <td className="border-b border-white/10 px-4 py-4 text-gray-300">{item.specs || '-'}</td>
                      {retailerNames.map((retailerName) => {
                        const retailerData = item.retailers.find((r) => r.name === retailerName);
                        return (
                          <td key={retailerName} className="border-b border-white/10 px-4 py-4 text-center">
                            {retailerData ? (
                              <a
                                href={retailerData.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:underline"
                              >
                                ৳ {Number(retailerData.price || 0).toLocaleString()}
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

          <div className="mt-8 flex gap-4">
            <a
              href="/"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
            >
              Back to Homepage
            </a>
            <a
              href="/configurator"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:scale-105"
            >
              Go to Configurator
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default ComparisonResultsPage;
