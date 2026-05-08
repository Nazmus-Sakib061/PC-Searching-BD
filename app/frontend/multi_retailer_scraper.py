
// pages/configurator.js
// Represents the Build Configurator page

import { useState, useEffect } from 'react';
// Assume useBuildManager is a custom hook or context for managing build state,
// compatibility checks, and bottleneck score calculations.
// Assume ComponentSelector and BuildSummary are other React components.
// import ComponentSelector from '../components/ComponentSelector';
// import BuildSummary from '../components/BuildSummary';

function BuildConfiguratorPage() {
  // State for selected components, total price, compatibility issues, bottleneck score
  const [selectedComponents, setSelectedComponents] = useState({}); // { CPU: {...}, GPU: {...}, ... }
  const [totalPrice, setTotalPrice] = useState(0);
  const [compatibilityIssues, setCompatibilityIssues] = useState([]);
  const [bottleneckScore, setBottleneckScore] = useState(null);

  // Function to update build state, compatibility, and bottleneck score
  const handleComponentSelect = (componentType, component) => {
    setSelectedComponents(prev => ({ ...prev, [componentType]: component }));
    // In a real app, this would trigger backend calls for compatibility and bottleneck analysis
    // For now, placeholders:
    setCompatibilityIssues([]); // Reset issues
    setBottleneckScore(null); // Reset score
    console.log(`Selected ${componentType}: ${component.name}`);
  };

  // Effect to recalculate price, compatibility, and bottleneck score when components change
  useEffect(() => {
    let currentPrice = 0;
    let issues = [];
    let systemForAnalysis = {};

    Object.values(selectedComponents).forEach(comp => {
      if (comp && comp.price) {
        currentPrice += comp.price;
      }
      // Populate systemForAnalysis for bottleneck/compatibility checks
      if (comp && comp.component_type) {
        systemForAnalysis[comp.component_type] = comp;
      }
    });
    setTotalPrice(currentPrice);

    // Placeholder for compatibility checks and bottleneck calculation
    // This would involve API calls to the backend
    if (Object.keys(systemForAnalysis).length > 0) {
      console.log("Performing compatibility and bottleneck analysis...");
      // Example: Mocking a bottleneck calculation
      setTimeout(() => {
        const mockBottleneck = Math.floor(Math.random() * 100) / 10; // Score 0.0-10.0
        setBottleneckScore(mockBottleneck);
        // Mock compatibility issues
        if (selectedComponents.CPU && selectedComponents.Motherboard && selectedComponents.CPU.socket_type !== selectedComponents.Motherboard.compatible_cpu_sockets?.find(s => s === selectedComponents.CPU.socket_type)) {
           issues.push("CPU socket type mismatch with Motherboard.");
        }
        setCompatibilityIssues(issues);
      }, 500);
    } else {
      setBottleneckScore(null); // Reset if no components selected
    }

  }, [selectedComponents]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Build Your Custom PC</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Component Selector Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          {/* Placeholder for ComponentSelector component */}
          <h2 className="text-2xl font-semibold mb-4">Select Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example: CPU Selector */}
            <div className="component-selector">
              <h3 className="text-lg font-medium mb-2">CPU</h3>
              {/* This would be a more complex selector component */}
              <select className="w-full p-3 border border-gray-300 rounded-md" onChange={(e) => handleComponentSelect('CPU', JSON.parse(e.target.value))}>
                <option value='{"name": "Select CPU", "price": 0}'>Select CPU</option>
                <option value='{"name": "Intel Core i9-13900K", "price": 75000, "socket_type": "LGA1700"}'>Intel Core i9-13900K</option>
                <option value='{"name": "AMD Ryzen 7 7700X", "price": 50000, "socket_type": "AM5"}'>AMD Ryzen 7 7700X</option>
              </select>
            </div>
            {/* Example: GPU Selector */}
            <div className="component-selector">
              <h3 className="text-lg font-medium mb-2">GPU</h3>
              <select className="w-full p-3 border border-gray-300 rounded-md" onChange={(e) => handleComponentSelect('GPU', JSON.parse(e.target.value))}>
                <option value='{"name": "Select GPU", "price": 0}'>Select GPU</option>
                <option value='{"name": "NVIDIA RTX 4070", "price": 120000, "vram_gb": 12}'>NVIDIA RTX 4070</option>
                <option value='{"name": "AMD RX 7800 XT", "price": 95000, "vram_gb": 16}'>AMD RX 7800 XT</option>
              </select>
            </div>
            {/* Example: Motherboard Selector */}
            <div className="component-selector">
              <h3 className="text-lg font-medium mb-2">Motherboard</h3>
              <select className="w-full p-3 border border-gray-300 rounded-md" onChange={(e) => handleComponentSelect('Motherboard', JSON.parse(e.target.value))}>
                <option value='{"name": "Select Motherboard", "price": 0}'>Select Motherboard</option>
                <option value='{"name": "ASUS ROG STRIX Z790-A", "price": 45000, "socket_type": "LGA1700", "ram_type": "DDR5", "ram_slots_count": 4, "max_ram_capacity_gb": 192, "form_factor": "ATX"}'>ASUS ROG STRIX Z790-A</option>
                <option value='{"name": "MSI B650 GAMING PLUS WIFI", "price": 30000, "socket_type": "AM5", "ram_type": "DDR5", "ram_slots_count": 4, "max_ram_capacity_gb": 128, "form_factor": "ATX"}'>MSI B650 GAMING PLUS WIFI</option>
              </select>
            </div>
            <div className="component-selector">
              <h3 className="text-lg font-medium mb-2">RAM</h3>
               <select className="w-full p-3 border border-gray-300 rounded-md" onChange={(e) => handleComponentSelect('RAM', JSON.parse(e.target.value))}>
                <option value='{"name": "Select RAM", "price": 0}'>Select RAM</option>
                <option value='{"name": "Corsair Vengeance 32GB DDR5 6000MHz CL30", "price": 12000, "ram_speed_mhz": 6000, "ram_capacity_gb": 32, "ram_form_factor": "DIMM", "ram_latency": "CL30", "modules_in_kit": 2}'>Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz CL30</option>
              </select>
            </div>
             {/* Add more component selectors here */}
          </div>
        </div>

        {/* Build Summary Area */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Your Build Summary</h2>
          <div className="mb-4">
            {Object.entries(selectedComponents).map(([type, comp]) => (
              comp && comp.name !== 'Select CPU' && comp.name !== 'Select GPU' && comp.name !== 'Select Motherboard' && comp.name !== 'Select RAM' && comp.price > 0 && (
                <div key={type} className="flex justify-between py-2 border-b border-gray-200">
                  <span>{comp.name}</span>
                  <span>৳ {comp.price.toLocaleString()}</span>
                </div>
              )
            ))}
          </div>
          <div className="border-t border-gray-300 pt-4 mt-4">
            <div className="flex justify-between font-bold text-xl">
              <span>Total Price:</span>
              <span>৳ {totalPrice.toLocaleString()}</span>
            </div>
          </div>
          
          {compatibilityIssues.length > 0 && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <h3 className="font-semibold">Compatibility Issues:</h3>
              <ul>
                {compatibilityIssues.map((issue, index) => (
                  <li key={index} className="list-disc ml-5">- {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {bottleneckScore !== null && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-md">
              <h3 className="font-semibold">Bottleneck Score: {bottleneckScore.toFixed(1)}/10</h3>
              <p>Analysis based on component balance.</p>
            </div>
          )}

          <button className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={totalPrice === 0 || compatibilityIssues.length > 0}>
            Save Build
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuildConfiguratorPage;

// pages/api/bottleneck-calculator.js (Example API Route - Server-side)
/*
export default function handler(req, res) {
  if (req.method === 'POST') {
    const { components } = req.body; // components = { CPU: {...}, GPU: {...}, ... }

    // --- Server-side Bottleneck Calculation ---
    // 1. Fetch performance scores for CPU and GPU from a database or lookup table.
    //    (This requires pre-processing or scraping benchmark data).
    // 2. Calculate CPU-GPU balance score.
    // 3. Calculate RAM score based on thresholds.
    // 4. Calculate Storage score (simplified).
    // 5. Calculate PSU score based on wattage adequacy.
    // 6. Combine scores using weights.
    // 7. Return the bottleneck score and rating.

    // Placeholder logic:
    const cpuData = components.CPU;
    const gpuData = components.GPU;
    const ramData = components.RAM;

    // Assume get_component_performance_score and calculate_bottleneck_score are defined server-side
    // const cpu_perf = get_component_performance_score('CPU', cpuData.name);
    // const gpu_perf = get_component_performance_score('GPU', gpuData.name);
    // const ram_details = { ram_type: ramData.ram_type, ram_speed_mhz: ramData.ram_speed_mhz, ... };
    // const psu_wattage = components.PSU?.wattage_w; // Need PSU data

    // Mock calculation for demonstration
    const mockBottleneckScore = 7.2; // Example score
    const mockRating = "Good Balance";

    res.status(200).json({
      bottleneck_score: mockBottleneckScore,
      rating: mockRating,
      // ... detailed analysis ...
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
*/

// --- Tailwind CSS Configuration (Example - assumed in tailwind.config.js) ---
/*
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
      },
      // Define custom colors, fonts, etc. if needed
    },
  },
  plugins: [],
}
*/

// --- SEO Configuration Notes ---
// - Use `next/head` in each page component to set dynamic titles, descriptions, meta tags.
// - Implement Schema.org markup using JSON-LD within `<script type="application/ld+json">` tags.
// - Generate sitemap.xml and robots.txt for search engine crawlers.
// - Ensure clean, semantic URLs for pages.
// - Image optimization via `next/image` also contributes to perceived performance, aiding SEO.
// --- State Management Notes ---
// - React Context API for global state (e.g., user auth).
// - Zustand or Jotai for local/shared state in complex components like the configurator.
// - React Query or SWR for server state management (data fetching and caching).
g).
ai for local/shared state in complex components like the configurator.
// - React Query or SWR for server state management (data fetching and caching).
