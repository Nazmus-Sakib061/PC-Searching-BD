import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SiteHeader from '../components/SiteHeader';

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatUpdatedAt(value) {
  if (!value) {
    return 'Fresh sync';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Fresh sync';
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ComparisonResultsPage() {
  const router = useRouter();
  const [comparisonData, setComparisonData] = useState([]);
  const [retailerNames, setRetailerNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('price_asc');

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

  const categories = useMemo(() => {
    return Array.from(new Set(comparisonData.map((item) => item.category).filter(Boolean))).sort((a, b) =>
      String(a).localeCompare(String(b))
    );
  }, [comparisonData]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const getMinPrice = (item) => {
      const prices = (item.retailers || [])
        .map((retailer) => Number(retailer.price || 0))
        .filter((price) => Number.isFinite(price) && price > 0);
      return prices.length > 0 ? Math.min(...prices) : Number.POSITIVE_INFINITY;
    };

    const getLatestUpdate = (item) => {
      const timestamps = (item.retailers || [])
        .map((retailer) => new Date(retailer.updated_at || '').getTime())
        .filter((ts) => Number.isFinite(ts) && ts > 0);
      return timestamps.length > 0 ? Math.max(...timestamps) : 0;
    };

    const items = comparisonData.filter((item) => {
      const searchable = [
        item.display_name,
        item.component,
        item.category,
        item.specs,
        ...(item.retailers || []).map((retailer) => retailer.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (categoryFilter && String(item.category || '') !== categoryFilter) {
        return false;
      }

      if (q && !searchable.includes(q)) {
        return false;
      }

      return true;
    });

    items.sort((a, b) => {
      const priceA = getMinPrice(a);
      const priceB = getMinPrice(b);
      const updateA = getLatestUpdate(a);
      const updateB = getLatestUpdate(b);

      if (sortOrder === 'price_desc') {
        return priceB - priceA;
      }
      if (sortOrder === 'name_asc') {
        return String(a.display_name || a.component || '').localeCompare(String(b.display_name || b.component || ''));
      }
      if (sortOrder === 'newest') {
        return updateB - updateA;
      }
      return priceA - priceB;
    });

    return items;
  }, [categoryFilter, comparisonData, searchTerm, sortOrder]);

  const summary = useMemo(() => {
    const prices = [];
    const retailerSet = new Set();
    let latestUpdate = 0;

    comparisonData.forEach((item) => {
      (item.retailers || []).forEach((retailer) => {
        retailerSet.add(retailer.name);
        const price = Number(retailer.price || 0);
        if (Number.isFinite(price) && price > 0) {
          prices.push(price);
        }
        const updatedAt = new Date(retailer.updated_at || '').getTime();
        if (Number.isFinite(updatedAt) && updatedAt > latestUpdate) {
          latestUpdate = updatedAt;
        }
      });
    });

    const cheapest = prices.length > 0 ? Math.min(...prices) : 0;
    const priciest = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      cheapest,
      priciest,
      retailerCount: retailerSet.size || retailerNames.length,
      latestUpdate,
    };
  }, [comparisonData, retailerNames.length]);

  const handleBack = () => {
    router.push('/configurator');
  };

  const visibleRetailers = retailerNames.length > 0 ? retailerNames : ['Retailer'];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
      </Head>

      <div className="min-h-screen bg-[#020406] text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.22),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(56,189,248,0.14),transparent_22%),radial-gradient(circle_at_52%_100%,rgba(29,78,216,0.22),transparent_28%),linear-gradient(180deg,#030711_0%,#020817_42%,#01030a_100%)]" />
        <SiteHeader active="compare" />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="crystal-card surface-shell rounded-[34px] p-5 md:p-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="blue-badge inline-flex rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[4px]">
                    Price Comparison
                  </p>
                  <span className="blue-outline-badge rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[3px]">
                    Live catalog
                  </span>
                </div>

                <div className="max-w-3xl">
                  <h1 className="text-3xl font-black leading-[0.96] text-slate-50 md:text-5xl">
                    Compare parts with a cleaner retailer matrix.
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base md:leading-8">
                    See the strongest prices, scan specs, and jump out to the retailer that matters without fighting a noisy
                    layout.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="blue-stat-card rounded-3xl p-4">
                    <div className="text-[10px] uppercase tracking-[3px] text-slate-400">Items</div>
                    <div className="mt-2 text-2xl font-black text-white">{comparisonData.length.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-slate-500">Catalog entries</div>
                  </div>
                  <div className="blue-stat-card rounded-3xl p-4">
                    <div className="text-[10px] uppercase tracking-[3px] text-slate-400">Retailers</div>
                    <div className="mt-2 text-2xl font-black text-white">{summary.retailerCount.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-slate-500">Price sources</div>
                  </div>
                  <div className="blue-stat-card rounded-3xl p-4">
                    <div className="text-[10px] uppercase tracking-[3px] text-slate-400">Lowest</div>
                    <div className="mt-2 text-2xl font-black text-sky-300">{formatPrice(summary.cheapest)}</div>
                    <div className="mt-1 text-xs text-slate-500">Best observed price</div>
                  </div>
                  <div className="blue-stat-card rounded-3xl p-4">
                    <div className="text-[10px] uppercase tracking-[3px] text-slate-400">Latest sync</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {summary.latestUpdate ? formatUpdatedAt(summary.latestUpdate) : 'Fresh sync'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Most recent scrape</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-shell rounded-[34px] p-5 md:p-8">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[4px] text-sky-300">Comparison Tools</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-50">Scan, filter, and compare.</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                    Narrow the table by name or category, then sort by price, date, or name to find the part you want faster.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[3px] text-slate-400">
                      Search
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by product, retailer, or specs"
                      className="w-full rounded-2xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[3px] text-slate-400">
                      Category
                    </span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[3px] text-slate-400">
                      Sort
                    </span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    >
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="name_asc">Name: A-Z</option>
                      <option value="newest">Newest Sync</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('');
                        setSortOrder('price_asc');
                      }}
                      className="secondary-glow-button w-full rounded-2xl px-4 py-3 text-sm font-semibold transition hover:border-sky-300/20 hover:bg-sky-500/5"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="crystal-card surface-shell mt-6 rounded-[34px] p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-700/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[4px] text-sky-300">Comparison Surface</p>
                <h2 className="mt-2 text-2xl font-black text-slate-50">Retailer matrix</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Compare {filteredItems.length.toLocaleString()} visible items across {visibleRetailers.length.toLocaleString()}{' '}
                  retailer columns.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
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
                  Open Builder
                </a>
              </div>
            </div>

            {loading && <p className="py-12 text-center text-lg text-gray-300">Loading comparisons...</p>}
            {error && <p className="py-12 text-center text-lg text-red-400">{error}</p>}

            {!loading && !error && comparisonData.length === 0 && (
              <p className="py-12 text-center text-lg text-gray-300">No comparison data available at the moment.</p>
            )}

            {!loading && !error && comparisonData.length > 0 && filteredItems.length === 0 && (
              <p className="py-12 text-center text-lg text-gray-300">No items match your filters.</p>
            )}

            {!loading && !error && filteredItems.length > 0 && (
              <div className="custom-scrollbar overflow-auto rounded-[28px] border border-slate-700/70 bg-[#040a19]/85">
                <table className="min-w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#061120]">
                    <tr>
                      <th className="border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[3px] text-slate-300">
                        Component
                      </th>
                      <th className="border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[3px] text-slate-300">
                        Category
                      </th>
                      <th className="border-b border-white/10 px-5 py-4 text-xs font-semibold uppercase tracking-[3px] text-slate-300">
                        Specs
                      </th>
                      {visibleRetailers.map((retailerName) => (
                        <th
                          key={retailerName}
                          className="border-b border-white/10 px-5 py-4 text-center text-xs font-semibold uppercase tracking-[3px] text-slate-300"
                        >
                          {retailerName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={
                          index % 2 === 0
                            ? 'bg-white/0 transition hover:bg-sky-400/[0.04]'
                            : 'bg-sky-400/[0.025] transition hover:bg-sky-400/[0.06]'
                        }
                      >
                        <td className="border-b border-white/10 px-5 py-5 align-top">
                          <div className="max-w-[420px]">
                            <div className="text-sm font-semibold text-white">{item.display_name || item.component}</div>
                            <div className="mt-1 text-xs uppercase tracking-[3px] text-slate-500">{item.component}</div>
                          </div>
                        </td>
                        <td className="border-b border-white/10 px-5 py-5 align-top">
                          <span className="blue-outline-badge inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[2px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="border-b border-white/10 px-5 py-5 align-top">
                          <div className="max-w-[420px] text-sm leading-6 text-slate-300">{item.specs || '-'}</div>
                        </td>
                        {visibleRetailers.map((retailerName) => {
                          const retailerData = (item.retailers || []).find((retailer) => retailer.name === retailerName);

                          return (
                            <td key={retailerName} className="border-b border-white/10 px-5 py-5 align-top text-center">
                              {retailerData ? (
                                <div className="mx-auto flex min-w-[160px] max-w-[200px] flex-col items-center gap-2 rounded-2xl border border-slate-700/70 bg-[#071122] px-4 py-4">
                                  <div className="text-2xl font-black text-sky-300">{formatPrice(retailerData.price)}</div>
                                  <div className="text-[10px] uppercase tracking-[3px] text-slate-500">
                                    {formatUpdatedAt(retailerData.updated_at)}
                                  </div>
                                  {retailerData.url ? (
                                    <a
                                      href={retailerData.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="blue-outline-badge rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[2px] transition hover:border-sky-300/30 hover:bg-sky-400/10"
                                    >
                                      Open Retailer
                                    </a>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-sm text-slate-500">-</span>
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
          </section>
        </main>
      </div>
    </>
  );
}

export default ComparisonResultsPage;
