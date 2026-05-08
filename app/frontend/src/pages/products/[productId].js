import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ProductDetails() {
  const router = useRouter();
  const { productId } = router.query;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(data => setProduct(data));
    }
  }, [productId]);

  if (!product) return <div className="text-white p-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10">
      <h1 className="text-4xl font-bold mb-6">{product.name}</h1>
      <p className="text-gray-400 mb-8">{product.category}</p>

      <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Price Comparison</h2>
      <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-4">Retailer</th>
              <th className="p-4">Price</th>
              <th className="p-4">Link</th>
            </tr>
          </thead>
          <tbody>
            {product.prices.map((p) => (
              <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="p-4">{p.retailer_name}</td>
                <td className="p-4">৳ {p.price.toLocaleString()}</td>
                <td className="p-4">
                  <a href={p.url} target="_blank" className="text-cyan-400 hover:underline">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
