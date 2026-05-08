import React, { useState, useEffect, useMemo } from 'react';

function ComponentSelector({ componentType, onSelectComponent }) {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
  const filteredComponents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return components;
    }
    return components.filter((comp) =>
      [comp.name, comp.category, comp.component_type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [components, searchTerm]);

  return (
    <div className="component-selector rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_24px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-white/[0.06]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-wide text-white">{componentType}</h3>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[2px] text-gray-400">
          Part
        </span>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading {componentType}...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!isLoading && !error && (
        <div className="space-y-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${componentType.toLowerCase()}...`}
            className="w-full rounded-xl border border-white/10 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />

          <select
            className="w-full rounded-xl border border-white/10 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            onChange={handleSelect}
            value={selectedComponent ? JSON.stringify(selectedComponent) : JSON.stringify(defaultOption)}
          >
            <option value={JSON.stringify(defaultOption)} className="bg-[#05080d]">
              Select {componentType}
            </option>
            {filteredComponents.map((comp) => (
              <option key={comp.id} value={JSON.stringify(comp)} className="bg-[#05080d]">
                {comp.name} - BDT {Number(comp.price || 0).toLocaleString()}
              </option>
            ))}
          </select>

          {filteredComponents.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-400">
              No {componentType.toLowerCase()} match found.
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && selectedComponent && selectedComponent.name !== `Select ${componentType}` && (
        <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100">
          Selected: {selectedComponent.name}
        </div>
      )}
    </div>
  );
}

export default ComponentSelector;
