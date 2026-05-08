import React, { useState, useEffect } from 'react';

function ComponentSelector({ componentType, onSelectComponent }) {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComponents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const urlType = componentType.toLowerCase().replace(' ', '-');
        const response = await fetch(`/api/components/${urlType}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setComponents(data);
        setSelectedComponent(null);
        onSelectComponent(componentType, { name: `Select ${componentType}`, price: 0, component_type: componentType });
      } catch (err) {
        console.error('Error fetching components:', err);
        setError('Failed to load components.');
      } finally {
        setIsLoading(false);
      }
    };

    if (componentType) {
      fetchComponents();
    }
  }, [componentType, onSelectComponent]);

  const handleSelect = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === '') {
      setSelectedComponent(null);
      onSelectComponent(componentType, { name: `Select ${componentType}`, price: 0, component_type: componentType });
      return;
    }

    try {
      const selectedComp = JSON.parse(selectedValue);
      setSelectedComponent(selectedComp);
      onSelectComponent(componentType, selectedComp);
    } catch (err) {
      console.error('Error parsing selected component JSON:', err);
    }
  };

  const defaultOption = { name: `Select ${componentType}`, price: 0, component_type: componentType };

  return (
    <div className="component-selector mb-6">
      <h3 className="mb-2 text-lg font-medium">{componentType}</h3>
      {isLoading && <p className="text-gray-500">Loading {componentType}...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && (
        <select
          className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          onChange={handleSelect}
          value={selectedComponent ? JSON.stringify(selectedComponent) : JSON.stringify(defaultOption)}
        >
          <option value={JSON.stringify(defaultOption)}>
            Select {componentType}
          </option>
          {components.map((comp) => (
            <option key={comp.id} value={JSON.stringify(comp)}>
              {comp.name} - ৳ {Number(comp.price || 0).toLocaleString()}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default ComponentSelector;
