
// pages/configurator.js
// Represents the Build Configurator page

import { useState, useEffect, useCallback } from 'react';
import ComponentSelector from '../components/ComponentSelector';
import BuildSummary from '../components/BuildSummary';

function BuildConfiguratorPage() {
  // State for selected components, total price, compatibility issues, bottleneck score
  const [selectedComponents, setSelectedComponents] = useState({}); // { CPU: {...}, GPU: {...}, ... }
  const [totalPrice, setTotalPrice] = useState(0);
  const [compatibilityIssues, setCompatibilityIssues] = useState([]);
  const [bottleneckScore, setBottleneckScore] = useState(null);
  const [isLoadingBuild, setIsLoadingBuild] = useState(false); // State to indicate if analysis is in progress

  // Function to update build state, compatibility, and bottleneck score
  const handleComponentSelect = useCallback((componentType, component) => {
    setSelectedComponents(prev => {
      // Prevent unnecessary updates if the component hasn't actually changed
      if (prev[componentType]?.id === component.id) return prev;
      return { ...prev, [componentType]: component };
    });
    setCompatibilityIssues([]);
    setBottleneckScore(null);
    console.log(`Selected ${componentType}: ${component.name}`);
  }, []);

  // Effect to recalculate price, compatibility, and bottleneck score when components change
  useEffect(() => {
    let currentPrice = 0;
    let systemForAnalysis = {};

    Object.values(selectedComponents).forEach(comp => {
      if (comp && comp.price) {
        currentPrice += comp.price;
      }
      // Populate systemForAnalysis for bottleneck/compatibility checks
      // Ensure only valid, non-default selections are included
      if (comp && comp.component_type && comp.name !== `Select ${comp.component_type}`) {
        systemForAnalysis[comp.component_type] = comp;
      }
    });
    setTotalPrice(currentPrice);

    // Only trigger analysis if enough core components are selected
    const hasCoreComponents = systemForAnalysis.CPU && systemForAnalysis.GPU && systemForAnalysis.Motherboard && systemForAnalysis.RAM;
    
    if (hasCoreComponents) {
      setIsLoadingBuild(true); // Start loading indicator
      console.log("Performing compatibility and bottleneck analysis...");
      // --- In a real application, this would be an API call ---
      // Example: Fetching bottleneck score from backend API
      fetch('/api/bottleneck-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: systemForAnalysis }),
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setBottleneckScore(data.bottleneck_score);
        setCompatibilityIssues(data.compatibility_issues || []); // Assuming API returns issues too
      })
      .catch(error => {
        console.error("Error calculating bottleneck:", error);
        setCompatibilityIssues([{ message: "Could not calculate bottleneck score. Please check component compatibility manually." }]);
        setBottleneckScore(null);
      })
      .finally(() => {
        setIsLoadingBuild(false); // Stop loading indicator
      });
    } else {
      // Reset if not enough components are selected for analysis
      setCompatibilityIssues([]);
      setBottleneckScore(null);
      setIsLoadingBuild(false);
    }

  }, [selectedComponents]);

  // Define component types to render selectors for
  const componentTypes = ["CPU", "GPU", "Motherboard", "RAM", "Storage", "PSU", "Case", "CPU Cooler"]; // Add more as needed

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Build Your Custom PC</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Component Selector Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Select Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {componentTypes.map(type => (
              <ComponentSelector
                key={type}
                componentType={type}
                onSelectComponent={handleComponentSelect}
              />
            ))}
          </div>
        </div>

        {/* Build Summary Area */}
        <div className="lg:col-span-1"> {/* Adjust col-span if needed */}
          <BuildSummary
            selectedComponents={selectedComponents}
            totalPrice={totalPrice}
            compatibilityIssues={compatibilityIssues}
            bottleneckScore={bottleneckScore}
            isLoadingBuild={isLoadingBuild} // Pass loading state to summary
          />
        </div>
      </div>
    </div>
  );
}

export default BuildConfiguratorPage;
