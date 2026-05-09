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

export default function ProductDetails() {
  const router = useRouter();
  const { productId } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
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
            </div>

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
        </section>
      </main>
    </div>
  );
}
