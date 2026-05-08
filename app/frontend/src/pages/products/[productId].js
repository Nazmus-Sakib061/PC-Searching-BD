
// pages/products/[productId].js
// Displays detailed information for a specific product.

import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head'; // Import Head for SEO meta tags

function ProductDetailPage() {
  const router = useRouter();
  const { productId } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Data Fetching Placeholder ---
        // In a real application, this would fetch product details from a dedicated product API endpoint
        // using the productId. The API would query the database for comprehensive product information.
        // Example API call:
        // const response = await fetch(`/api/products/${productId}`);
        // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        // const productData = await response.json();
        // setProduct(productData);

        // For demonstration, we'll fetch from the general components API and filter by ID.
        // This is a simplification; a real API might be more efficient.
        
        let foundProduct = null;
        // List of component types to search. This could be made dynamic or more efficient.
        const componentTypesToSearch = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "CPU Cooler"]; 

        for (const type of componentTypesToSearch) {
          const response = await fetch(`/api/components/${type}`); // Fetch from our component API route
          if (!response.ok) {
            console.warn(`Failed to fetch ${type} data: ${response.status}`);
            continue; 
          }
          const componentsOfType = await response.json();
          const product = componentsOfType.find(p => p.id === parseInt(productId));
          if (product) {
            foundProduct = { ...product, component_type: type }; // Add type for context
            break; // Found the product, stop searching
          }
        }
        
        setProduct(foundProduct || null);
        if (!foundProduct) {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details. Please check your network connection or try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]); // Re-fetch if productId changes

  if (!productId) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading product...</div>;
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading product details for ID: {productId}...</div>;
  }

  if (error || !product) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">Error: {error || 'Product details could not be loaded.'}</div>;
  }

  // --- SEO Meta Tags for Product Page ---
  // Dynamically set meta tags using product data for better SEO.
  const pageTitle = `${product.name} - ${product.component_type || 'Component'} Details | PC Maker BD`;
  const pageDescription = `Detailed specifications and price for ${product.name}. Find out more about ${product.name} from PC Maker BD.`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {/* Add og:image if you have product images */}
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">{product.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {/* Placeholder for image */}
            <div className="w-full h-64 bg-gray-300 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-600">Product Image Placeholder</span>
            </div>
            {/* Display specific specs */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Specifications</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(product).map(([key, value]) => {
                  // Filter out fields that are better displayed elsewhere or not suitable for simple key-value pairs
                  if (key === 'id' || key === 'name' || key === 'component_type' || key === 'url' || key === 'image' || key === 'price' || key === 'performance_score' || key === 'required_psu_wattage' || key === 'recommended_psu_wattage' || typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) return null; // Skip certain fields
                  
                  let formattedKey = key.replace(/_/g, ' ').toUpperCase();
                  let displayValue = String(value);

                  if (key === 'price' && value > 0) displayValue = `৳ ${value.toLocaleString()}`;
                  if (key === 'socket_type') formattedKey = 'SOCKET TYPE';
                  if (key === 'vram_gb') displayValue = `${value}GB`;
                  if (key === 'power_consumption_w') formattedKey = 'POWER CONSUMPTION';
                  if (key === 'ram_speed_mhz') formattedKey = 'SPEED';
                  if (key === 'storage_capacity_gb') formattedKey = 'CAPACITY';
                  if (key === 'wattage_w') formattedKey = 'WATTAGE';
                  if (key === 'efficiency_rating') formattedKey = 'EFFICIENCY';
                  if (key === 'socket_support' && Array.isArray(value)) displayValue = value.join(', ');
                  if (key === 'form_factor') formattedKey = 'FORM FACTOR';
                  if (key === 'integrated_graphics_support') displayValue = value ? 'Yes' : 'No';
                  if (key === 'tdps') formattedKey = 'TDP';
                  if (key === 'boost_clock_ghz') formattedKey = 'BOOST CLOCK';
                  if (key === 'base_clock_ghz') formattedKey = 'BASE CLOCK';
                  if (key === 'pcie_version') formattedKey = 'PCIe VERSION';
                  if (key === 'vram_type') formattedKey = 'VRAM TYPE';
                  if (key === 'required_psu_wattage') formattedKey = 'REQUIRED PSU WATTAGE';
                  if (key === 'recommended_psu_wattage') formattedKey = 'RECOMMENDED PSU WATTAGE';


                  // Avoid rendering if the value is null, undefined, or an empty string after formatting
                  if (!displayValue || displayValue === 'null' || displayValue === 'undefined' || displayValue.trim() === '') return null;

                  return (
                    <li key={key} className="flex justify-between py-1">
                      <strong className="text-gray-700">{formattedKey}:</strong> <span className="text-gray-800">{displayValue}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h3 className="text-xl font-semibold mb-3">Retailer Prices</h3>
              {/* Placeholder for retailer price data */}
              <p className="text-sm text-gray-600 mb-2">Prices may vary by retailer.</p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                {/* In a real app, these would be fetched and displayed */}
                {product.retailers ? product.retailers.map((retailer, idx) => (
                  <li key={idx} className="flex justify-between">
                    {retailer.name}: <span className="font-medium">৳ {retailer.price.toLocaleString()}</span>
                  </li>
                )) : (
                  <>
                    <li className="flex justify-between">Star Tech: <span className="font-medium">৳ {product.price ? (product.price * 1.02).toLocaleString() : 'N/A'}</span></li> {/* Mocking slightly different prices */}
                    <li className="flex justify-between">Ryans Computers: <span className="font-medium">৳ {product.price ? (product.price * 0.99).toLocaleString() : 'N/A'}</span></li>
                    <li className="flex justify-between">Tech Land BD: <span className="font-medium">৳ {product.price ? (product.price * 1.03).toLocaleString() : 'N/A'}</span></li>
                  </>
                )}
              </ul>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300">
              Add to Build
            </button>
          </div>
        </div>
        <div className="text-center mt-8">
          <a href="/" className="text-blue-600 hover:underline mr-4">Back to Homepage</a>
          <a href="/configurator" className="text-blue-600 hover:underline">Back to Configurator</a>
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
       }
        
        setProduct(foundProduct || null);
        if (!foundProduct) {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details. Please check your network connection or try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]); // Re-fetch if productId changes

  if (!productId) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading product...</div>;
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading product details for ID: {productId}...</div>;
  }

  if (error || !product) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">Error: {error || 'Product details could not be loaded.'}</div>;
  }

  // --- SEO Meta Tags for Product Page ---
  // Dynamically set meta tags using product data for better SEO.
  const pageTitle = `${product.name} - ${product.component_type || 'Component'} Details | PC Maker BD`;
  const pageDescription = `Detailed specifications and price for ${product.name}. Find out more about ${product.name} from PC Maker BD.`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {/* Add og:image if you have product images */}
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">{product.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {/* Placeholder for image */}
            <div className="w-full h-64 bg-gray-300 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-600">Product Image Placeholder</span>
            </div>
            {/* Display specific specs */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Specifications</h3>
              <ul className="space-y-2 text-sm">
                {Object.entries(product).map(([key, value]) => {
                  // Filter out fields that are better displayed elsewhere or not suitable for simple key-value pairs
                  if (key === 'id' || key === 'name' || key === 'component_type' || key === 'url' || key === 'image' || key === 'price' || key === 'performance_score' || key === 'required_psu_wattage' || key === 'recommended_psu_wattage' || typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) return null; // Skip certain fields
                  
                  let formattedKey = key.replace(/_/g, ' ').toUpperCase();
                  let displayValue = String(value);

                  if (key === 'price' && value > 0) displayValue = `৳ ${value.toLocaleString()}`;
                  if (key === 'socket_type') formattedKey = 'SOCKET TYPE';
                  if (key === 'vram_gb') displayValue = `${value}GB`;
                  if (key === 'power_consumption_w') formattedKey = 'POWER CONSUMPTION';
                  if (key === 'ram_speed_mhz') formattedKey = 'SPEED';
                  if (key === 'storage_capacity_gb') formattedKey = 'CAPACITY';
                  if (key === 'wattage_w') formattedKey = 'WATTAGE';
                  if (key === 'efficiency_rating') formattedKey = 'EFFICIENCY';
                  if (key === 'socket_support' && Array.isArray(value)) displayValue = value.join(', ');
                  if (key === 'form_factor') formattedKey = 'FORM FACTOR';
                  if (key === 'integrated_graphics_support') displayValue = value ? 'Yes' : 'No';
                  if (key === 'tdps') formattedKey = 'TDP';
                  if (key === 'boost_clock_ghz') formattedKey = 'BOOST CLOCK';
                  if (key === 'base_clock_ghz') formattedKey = 'BASE CLOCK';
                  if (key === 'pcie_version') formattedKey = 'PCIe VERSION';
                  if (key === 'vram_type') formattedKey = 'VRAM TYPE';
                  if (key === 'required_psu_wattage') formattedKey = 'REQUIRED PSU WATTAGE';
                  if (key === 'recommended_psu_wattage') formattedKey = 'RECOMMENDED PSU WATTAGE';


                  // Avoid rendering if the value is null, undefined, or an empty string after formatting
                  if (!displayValue || displayValue === 'null' || displayValue === 'undefined' || displayValue.trim() === '') return null;

                  return (
                    <li key={key} className="flex justify-between py-1">
                      <strong className="text-gray-700">{formattedKey}:</strong> <span className="text-gray-800">{displayValue}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h3 className="text-xl font-semibold mb-3">Retailer Prices</h3>
              {/* Placeholder for retailer price data */}
              <p className="text-sm text-gray-600 mb-2">Prices may vary by retailer.</p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                {/* In a real app, these would be fetched and displayed */}
                {product.retailers ? product.retailers.map((retailer, idx) => (
                  <li key={idx} className="flex justify-between">
                    {retailer.name}: <span className="font-medium">৳ {retailer.price.toLocaleString()}</span>
                  </li>
                )) : (
                  <>
                    <li className="flex justify-between">Star Tech: <span className="font-medium">৳ {product.price ? (product.price * 1.02).toLocaleString() : 'N/A'}</span></li> {/* Mocking slightly different prices */}
                    <li className="flex justify-between">Ryans Computers: <span className="font-medium">৳ {product.price ? (product.price * 0.99).toLocaleString() : 'N/A'}</span></li>
                    <li className="flex justify-between">Tech Land BD: <span className="font-medium">৳ {product.price ? (product.price * 1.03).toLocaleString() : 'N/A'}</span></li>
                  </>
                )}
              </ul>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300">
              Add to Build
            </button>
          </div>
        </div>
        <div className="text-center mt-8">
          <a href="/" className="text-blue-600 hover:underline mr-4">Back to Homepage</a>
          <a href="/configurator" className="text-blue-600 hover:underline">Back to Configurator</a>
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
