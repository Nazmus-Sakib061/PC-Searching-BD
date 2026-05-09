import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SiteHeader from '../../components/SiteHeader';

function clampStyle(lines = 2) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
}

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getProductSlot(componentType) {
  const normalized = String(componentType || '').toLowerCase();
  if (normalized.includes('cpu cooler')) return 'CPU Cooler';
  if (normalized.includes('cpu')) return 'CPU';
  if (normalized.includes('gpu') || normalized.includes('graphics')) return 'GPU';
  if (normalized.includes('motherboard')) return 'Motherboard';
  if (normalized.includes('ram')) return 'RAM';
  if (normalized.includes('psu') || normalized.includes('power supply')) return 'PSU';
  return null;
}

function compactOptionLabel(option) {
  return option?.display_name || option?.compact_name || option?.name || 'Select part';
}

export default function ProductDetails() {
  const router = useRouter();
  const { productId } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [catalogOptions, setCatalogOptions] = useState({
    CPU: [],
    GPU: [],
    Motherboard: [],
    RAM: [],
    PSU: [],
  });
  const [selectedParts, setSelectedParts] = useState({
    CPU: null,
    GPU: null,
    Motherboard: null,
    RAM: null,
    PSU: null,
  });
  const [bottleneckScore, setBottleneckScore] = useState(null);
  const [bottleneckIssues, setBottleneckIssues] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatorStatus, setCalculatorStatus] = useState('Select parts to calculate bottleneck balance.');

  const handleBack = () => {
    router.push('/configurator');
  };

  useEffect(() => {
    if (!router.isReady) {
      return undefined;
    }

    const handlePopState = () => {
      router.replace('/configurator');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/products/${productId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load product');
        }
        return data;
      })
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const types = ['cpu', 'gpu', 'motherboard', 'ram', 'psu'];
        const responses = await Promise.all(
          types.map(async (type) => {
            const res = await fetch(`/api/components/${type}?sort=price_asc`);
            if (!res.ok) {
              return [type, []];
            }
            const data = await res.json();
            return [type, Array.isArray(data) ? data : []];
          })
        );

        const nextCatalog = {};
        responses.forEach(([type, items]) => {
          const key =
            type === 'cpu'
              ? 'CPU'
              : type === 'gpu'
                ? 'GPU'
                : type === 'motherboard'
                  ? 'Motherboard'
                  : type === 'ram'
                    ? 'RAM'
                    : 'PSU';
          nextCatalog[key] = items;
        });

        setCatalogOptions(nextCatalog);
      } catch (err) {
        console.error('Failed to load catalog options:', err);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    if (!product) {
      return;
    }

    const slot = getProductSlot(product.component_type || product.category);
    if (!slot) {
      return;
    }

    setSelectedParts((prev) => ({
      ...prev,
      [slot]: product,
    }));
  }, [product]);

  const handlePartChange = (slot, id) => {
    const option = catalogOptions[slot].find((item) => String(item.id) === String(id));
    setSelectedParts((prev) => ({
      ...prev,
      [slot]: option || null,
    }));
  };

  const runBottleneck = async () => {
    const payload = {};
    Object.entries(selectedParts).forEach(([slot, part]) => {
      if (part) {
        payload[slot] = part;
      }
    });

    setIsCalculating(true);
    setCalculatorStatus('Analyzing selected parts...');

    try {
      const res = await fetch('/api/bottleneck-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to calculate bottleneck.');
      }
      setBottleneckScore(data.bottleneck_score);
      setBottleneckIssues(data.compatibility_issues || []);
      setCalculatorStatus(
        data.compatibility_issues && data.compatibility_issues.length > 0
          ? 'Compatibility issues found.'
          : 'No compatibility issues detected.'
      );
    } catch (err) {
      console.error('Bottleneck calculation failed:', err);
      setBottleneckScore(null);
      setBottleneckIssues([{ message: err.message || 'Failed to calculate bottleneck.' }]);
      setCalculatorStatus('Analysis failed.');
    } finally {
      setIsCalculating(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#020406] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#020406] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-[1600px] px-4 py-24 text-white sm:px-6 lg:px-8">Loading...</div>
      </div>
    );
  }

  const prices = product.prices || [];
  const bestPrice = prices.length > 0 ? prices[0] : null;

  return (
    <div className="min-h-screen bg-[#020406] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(0,140,255,0.2),transparent_26%),radial-gradient(circle_at_82%_22%,rgba(80,255,150,0.15),transparent_22%),linear-gradient(to_bottom,#020406,#010101)]" />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Back to Configurator
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[4px] text-emerald-300">
                Product Details
              </p>
              <h1 className="mt-4 text-3xl font-black leading-[1.05] md:text-5xl">
                {product.display_name || product.name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-gray-300" style={clampStyle(4)}>
                {product.component_type || product.category}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                <div className="text-xs uppercase tracking-[3px] text-gray-500">Best Price</div>
                <div className="mt-2 text-3xl font-black text-emerald-300">
                  {bestPrice ? formatPrice(bestPrice.price) : '-'}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {bestPrice ? bestPrice.retailer_name : 'No retailer data'}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                <div className="text-xs uppercase tracking-[3px] text-gray-500">Price Rows</div>
                <div className="mt-2 text-3xl font-black text-white">{prices.length}</div>
                <div className="mt-2 text-sm text-gray-400">Retailer offers in the live catalog</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.5fr]">
            <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">Price List</h2>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[3px] text-gray-400">
                  Sorted Low to High
                </span>
              </div>

              {prices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-gray-400">
                  No retailer prices available for this item.
                </div>
              ) : (
                <div className="grid gap-3">
                  {prices.map((priceRow) => (
                    <a
                      key={priceRow.id}
                      href={priceRow.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="grid gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-500/30 hover:bg-white/[0.06] md:grid-cols-[1fr_auto_auto]"
                    >
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[3px] text-gray-500">Retailer</div>
                        <div className="mt-2 text-lg font-semibold text-white">{priceRow.retailer_name}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[3px] text-gray-500">Price</div>
                        <div className="mt-2 text-lg font-bold text-emerald-300">{formatPrice(priceRow.price)}</div>
                      </div>
                      <div className="flex items-center">
                        <span className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-4 py-2 text-sm font-bold text-black">
                          View Offer
                        </span>
                      </div>
                    </a>
                    ))}
                </div>
              )}

              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Bottleneck Calculator</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Compare this item with live catalog parts and get a balance score.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={runBottleneck}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-4 py-2 text-sm font-bold text-black transition hover:scale-[1.01]"
                    disabled={isCalculating}
                  >
                    {isCalculating ? 'Calculating...' : 'Calculate'}
                  </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {['CPU', 'GPU', 'Motherboard', 'RAM', 'PSU'].map((slot) => (
                    <div key={slot} className="rounded-2xl border border-white/10 bg-black/35 p-3">
                      <label className="mb-2 block text-xs uppercase tracking-[3px] text-gray-500">{slot}</label>
                      <select
                        className="w-full rounded-xl border border-white/10 bg-[#05080d] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                        value={selectedParts[slot]?.id || ''}
                        onChange={(e) => handlePartChange(slot, e.target.value)}
                      >
                        <option value="">Select {slot}</option>
                        {catalogOptions[slot].map((option) => (
                          <option key={option.id} value={option.id}>
                            {compactOptionLabel(option)} - {formatPrice(option.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="text-xs uppercase tracking-[3px] text-gray-500">Score</div>
                    <div className="mt-3 text-5xl font-black text-emerald-300">
                      {bottleneckScore !== null ? `${Number(bottleneckScore).toFixed(1)}/100` : '--'}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">{calculatorStatus}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="text-xs uppercase tracking-[3px] text-gray-500">Selected Parts</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {['CPU', 'GPU', 'Motherboard', 'RAM', 'PSU'].map((slot) => {
                        const part = selectedParts[slot];
                        return (
                          <div key={slot} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                            <div className="text-[11px] uppercase tracking-[2.5px] text-gray-500">{slot}</div>
                            <div className="mt-1 text-sm font-semibold text-white" style={clampStyle(2)}>
                              {part ? compactOptionLabel(part) : 'Not selected'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {bottleneckIssues.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-red-200">
                    {bottleneckIssues.map((issue, index) => (
                      <li key={index} className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                        {issue.message || issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 sm:p-6">
                <h2 className="text-2xl font-semibold text-white">Quick Details</h2>
                <dl className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <dt className="text-xs uppercase tracking-[3px] text-gray-500">Category</dt>
                    <dd className="mt-2 text-base font-semibold text-white">{product.category}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <dt className="text-xs uppercase tracking-[3px] text-gray-500">Component Type</dt>
                    <dd className="mt-2 text-base font-semibold text-white">{product.component_type || product.category}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <dt className="text-xs uppercase tracking-[3px] text-gray-500">Source</dt>
                    <dd className="mt-2 text-base font-semibold text-white">{product.source_name || 'Live Source'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
