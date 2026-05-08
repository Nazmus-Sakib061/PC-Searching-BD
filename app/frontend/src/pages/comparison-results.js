
// pages/comparison-results.js
// Page to display component price comparisons across retailers.

import React, { useState, useEffect } from 'react';
import Head from 'next/head'; // Import Head for SEO meta tags

function ComparisonResultsPage() {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Data Fetching Placeholder ---
        // In a production application, this section would fetch aggregated comparison data
        // from your backend API. The API would likely query the PostgreSQL database for
        // price history across different retailers for specific components.
        // Example API call:
        // const response = await fetch('/api/comparison-data?componentType=GPU&componentId=10');
        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }
        // const data = await response.json();
        // setComparisonData(data);

        // For demonstration, we'll use mock data.
        const mockData = [
          {
            component: "NVIDIA RTX 4070",
            specs: "12GB GDDR6X, PCIe 4.0",
            retailers: [
              { name: "Star Tech", price: 120000, url: "https://www.startech.com.bd/nvidia-geforce-rtx-4070-graphics-card" },
              { name: "Ryans Computers", price: 118000, url: "https://www.ryanscomputers.com/nvidia-geforce-rtx-4070-12gb-graphics-card" },
              { name: "Tech Land BD", price: 122000, url: "https://www.techlandbd.com/nvidia-geforce-rtx-4070-12gb-graphics-card" }
            ]
          },
          {
            component: "Intel Core i9-13900K",
            specs: "24 Cores, 32 Threads, 5.8GHz Boost, LGA1700",
            retailers: [
              { name: "Star Tech", price: 75000, url: "https://www.startech.com.bd/intel-core-i9-13900k-processor" },
              { name: "Ryans Computers", price: 74500, url: "https://www.ryanscomputers.com/intel-core-i9-13900k-processor" },
              { name: "Tech Land BD", price: 76000, url: "https://www.techlandbd.com/intel-core-i9-13900k-processor" }
            ]
          },
          {
            component: "Samsung 970 EVO Plus 1TB NVMe SSD",
            specs: "1TB NVMe PCIe Gen3, 3500MB/s Read",
            retailers: [
              { name: "Star Tech", price: 9000, url: "https://www.startech.com.bd/samsung-970-evo-plus-1tb-nvme-ssd" },
              { name: "Ryans Computers", price: 8800, url: "https://www.ryanscomputers.com/samsung-970-evo-plus-1tb-nvme-ssd" },
              { name: "Tech Land BD", price: 9100, url: "https://www.techlandbd.com/samsung-970-evo-plus-1tb-nvme-ssd" }
            ]
          }
          // Add more comparison data...
        ];
        setComparisonData(mockData);
      } catch (err) {
        console.error("Error fetching comparison data:", err);
        setError("Failed to load comparison data. Please check your network connection or try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- SEO Meta Tags ---
  // Dynamically set meta tags for better SEO. This would ideally use component data or query params.
  // For a general comparison page, generic tags are used here.
  const pageTitle = "Component Price Comparison - PC Maker BD";
  const pageDescription = "Compare prices of PC components like CPUs, GPUs, Motherboards, and more from Star Tech, Ryans Computers, and Tech Land BD.";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {/* Add Open Graph tags for social sharing */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {/* Add og:image if you have a relevant image */}
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Component Price Comparisons</h1>
        {loading && <p className="text-center text-xl my-8">Loading comparisons...</p>}
        {error && <p className="text-center text-xl my-8 text-red-500">{error}</p>}
        {!loading && !error && comparisonData.length === 0 && (
          <p className="text-center text-xl my-8">No comparison data available at the moment.</p>
        )}
        {!loading && !error && comparisonData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left font-semibold">Component</th>
                  <th className="border px-4 py-2 text-left font-semibold">Specifications</th>
                  <th className="border px-4 py-2 text-center font-semibold">Star Tech</th>
                  <th className="border px-4 py-2 text-center font-semibold">Ryans Computers</th>
                  <th className="border px-4 py-2 text-center font-semibold">Tech Land BD</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border px-4 py-2 font-medium">{item.component}</td>
                    <td className="border px-4 py-2">{item.specs}</td>
                    {/* Map retailer prices */}
                    {['Star Tech', 'Ryans Computers', 'Tech Land BD'].map((retailerName, retailerIndex) => {
                      const retailerData = item.retailers.find(r => r.name === retailerName);
                      return (
                        <td key={retailerIndex} className="border px-4 py-2 text-center">
                          {retailerData ? (
                            <a href={retailerData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              ৳ {retailerData.price.toLocaleString()}
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
        <div className="text-center mt-8">
          <a href="/" className="text-blue-600 hover:underline mr-4">Back to Homepage</a>
          <a href="/configurator" className="text-blue-600 hover:underline">Go to Configurator</a>
        </div>
      </div>
    </>
  );
}

export default ComparisonResultsPage;
