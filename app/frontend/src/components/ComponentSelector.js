import React, { useEffect, useMemo, useState } from 'react';

function compactText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^Model #:\s*/i, '')
    .replace(/^REFURBISHED\s+/i, '')
    .replace(/\*\s*Save:.*$/i, '')
    .trim();
}

function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function clampStyle(lines = 2) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
}

function ComponentSelector({ componentType, onSelectComponent }) {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('price_asc');
  const [brandFilter, setBrandFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  useEffect(() => {
    const fetchComponents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const urlType = componentType.toLowerCase().replace(' ', '-');
        const response = await fetch(`/api/components/${urlType}?sort=${encodeURIComponent(sortOrder)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setComponents(Array.isArray(data) ? data : []);
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
  }, [componentType, onSelectComponent, sortOrder]);

  useEffect(() => {
    if (!isBrowserOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBrowserOpen]);

  const defaultOption = { name: `Select ${componentType}`, price: 0, component_type: componentType };

  const brandOptions = useMemo(() => {
    const values = components
      .map((component) => component.brand)
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [components]);

  const filteredComponents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;
    const brandQuery = brandFilter.trim().toLowerCase();

    return components.filter((component) => {
      const price = Number(component.price || component.min_price || 0);
      const haystack = [
        component.display_name,
        component.name,
        component.brand,
        component.model,
        component.category,
        component.component_type,
        JSON.stringify(component.specs || {}),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (query && !haystack.includes(query)) {
        return false;
      }
      if (brandQuery && String(component.brand || '').toLowerCase() !== brandQuery) {
        return false;
      }
      if (min !== null && !Number.isNaN(min) && price < min) {
        return false;
      }
      if (max !== null && !Number.isNaN(max) && price > max) {
        return false;
      }
      return true;
    });
  }, [brandFilter, components, maxPrice, minPrice, searchTerm]);

  const selectedLabel = selectedComponent?.display_name || selectedComponent?.name || defaultOption.name;

  const handleSelect = (component) => {
    setSelectedComponent(component);
    onSelectComponent(componentType, component);
    setIsBrowserOpen(false);
  };

  return (
    <>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_24px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-white/[0.06]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-white">{componentType}</h3>
            <p className="mt-1 text-xs uppercase tracking-[3px] text-gray-500">
              {filteredComponents.length.toLocaleString()} products available
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[2px] text-gray-400">
            Live List
          </span>
        </div>

        {isLoading && <p className="text-sm text-gray-400">Loading {componentType}...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!isLoading && !error && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[3px] text-gray-500">Selected Part</p>
                  <div className="mt-2 text-sm font-semibold text-white" style={clampStyle(2)}>
                    {selectedLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBrowserOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-4 py-3 text-sm font-bold text-black transition hover:scale-[1.01]"
                >
                  Browse Full List
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-gray-500">Results</div>
                  <div className="mt-1 font-semibold text-white">{filteredComponents.length}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-gray-500">Sort</div>
                  <div className="mt-1 font-semibold text-white">
                    {sortOrder === 'price_asc' ? 'Low to High' : sortOrder === 'price_desc' ? 'High to Low' : 'A-Z'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-gray-500">Currency</div>
                  <div className="mt-1 font-semibold text-white">$ USD</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="text-gray-500">Brand Filter</div>
                  <div className="mt-1 font-semibold text-white">{brandFilter || 'All'}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${componentType.toLowerCase()}...`}
                className="w-full rounded-xl border border-white/10 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">All Brands</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min price"
                className="w-full rounded-xl border border-white/10 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max price"
                className="w-full rounded-xl border border-white/10 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {filteredComponents.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-gray-400">
                No {componentType.toLowerCase()} match found in the live catalog.
              </div>
            )}
          </div>
        )}
      </div>

      {isBrowserOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#020406]/95 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-black/50 px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[4px] text-emerald-300">
                  {componentType} Catalog
                </p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  Choose a part from the full-screen list
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {filteredComponents.length.toLocaleString()} products, sorted by {sortOrder.replace('_', ' ')}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowserOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Close
              </button>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-5 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${componentType.toLowerCase()}...`}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">All Brands</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min price"
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max price"
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {filteredComponents.length === 0 ? (
                <div className="grid min-h-[50vh] place-items-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
                  <div>
                    <div className="text-2xl font-black text-white">No products found</div>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-gray-400">
                      This category currently has no matching live items. Try clearing filters or picking another search term.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredComponents.map((component) => {
                    const displayName = compactText(component.display_name || component.name);
                    const isSelected =
                      selectedComponent && String(selectedComponent.id) === String(component.id);

                    return (
                      <button
                        key={component.id}
                        type="button"
                        onClick={() => handleSelect(component)}
                        className={`group rounded-[28px] border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(0,180,255,0.12)] ${
                          isSelected
                            ? 'border-emerald-400/40 bg-emerald-400/10'
                            : 'border-white/10 bg-white/[0.04] hover:border-cyan-500/30 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-[3px] text-gray-500">
                              {component.brand || component.source_name || 'Live Source'}
                            </div>
                            <div
                              className="mt-2 text-base font-semibold leading-7 text-white"
                              style={clampStyle(2)}
                              title={component.name}
                            >
                              {displayName}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[2px] text-gray-300">
                            {component.category}
                          </div>
                        </div>

                        <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-3">
                          <div className="text-xs uppercase tracking-[3px] text-gray-500">Price</div>
                          <div className="mt-1 text-2xl font-black text-emerald-300">{formatPrice(component.price)}</div>
                          <div className="mt-1 text-[11px] text-gray-500">Live Newegg price</div>
                        </div>

                        {component.description ? (
                          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-gray-300" style={clampStyle(3)}>
                            {component.description}
                          </div>
                        ) : null}

                        <div className="mb-4 text-xs uppercase tracking-[3px] text-gray-500">
                          {component.availability || 'Availability unknown'}
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[3px] text-gray-400">
                            Select to add
                          </span>
                          <span className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-3 py-2 text-xs font-bold text-black">
                            Choose
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ComponentSelector;
