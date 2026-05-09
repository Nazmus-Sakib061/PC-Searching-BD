import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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
      <div className="min-h-screen bg-[#050505] p-10 text-white">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (loading || !product) {
    return <div className="p-20 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] p-10 text-white">
      <h1 className="mb-6 text-4xl font-bold">{product.name}</h1>
      <p className="mb-8 text-gray-400">{product.component_type || product.category}</p>

      <h2 className="mb-4 text-2xl font-semibold text-cyan-400">Price Comparison</h2>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4">Retailer</th>
              <th className="p-4">Price</th>
              <th className="p-4">Link</th>
            </tr>
          </thead>
          <tbody>
            {(product.prices || []).map((p) => (
              <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="p-4">{p.retailer_name}</td>
                <td className="p-4">$ {Number(p.price).toLocaleString()}</td>
                <td className="p-4">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
