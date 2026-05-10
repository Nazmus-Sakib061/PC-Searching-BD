import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

function ComponentSelector({ componentType, selectedComponent, onSelectComponent, onRemoveComponent, isHydrated = true }) {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('price_asc');
  const [brandFilter, setBrandFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const browserListRef = useRef(null);

  const isMulti = ['GPU', 'RAM', 'Storage'].includes(componentType);
  const defaultOption = { name: `Select ${componentType}`, price: 0, component_type: componentType };

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

        const hasSelection = Array.isArray(selectedComponent)
          ? selectedComponent.length > 0
          : !!selectedComponent && selectedComponent.name !== `Select ${componentType}`;

        if (isHydrated && !hasSelection) {
          onSelectComponent(componentType, defaultOption);
        }
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
  }, [componentType, isHydrated, onSelectComponent, selectedComponent, sortOrder]);

  useEffect(() => {
    if (!isBrowserOpen) {
      return undefined;
    }

    window.requestAnimationFrame(() => {
      if (browserListRef.current) {
        browserListRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBrowserOpen]);

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

  const selectedItems = Array.isArray(selectedComponent)
    ? selectedComponent.filter(Boolean)
    : selectedComponent && selectedComponent.name !== `Select ${componentType}`
      ? [selectedComponent]
      : [];

  const selectedLabel = selectedItems[0]?.display_name || selectedItems[0]?.name || defaultOption.name;

  const handleSelect = (component) => {
    onSelectComponent(componentType, component);
    setIsBrowserOpen(false);
  };

  const handleRemove = (componentId) => {
    if (typeof onRemoveComponent === 'function') {
      onRemoveComponent(componentType, componentId);
    } else {
      onSelectComponent(componentType, defaultOption);
    }
    setIsBrowserOpen(false);
  };

  const handleBrowserListWheel = useCallback((event) => {
    if (!browserListRef.current) {
      return;
    }

    browserListRef.current.scrollTop += event.deltaY;
    event.preventDefault();
  }, []);

  const removeOneText = 'Remove one';

  return (
    <>
      <div className="crystal-card surface-shell rounded-[28px] p-4 transition hover:-translate-y-0.5 hover:border-sky-400/24">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-white">{componentType}</h3>
            <p className="mt-1 text-xs uppercase tracking-[3px] text-gray-500">
              {filteredComponents.length.toLocaleString()} products available
            </p>
          </div>
          <span className="blue-outline-badge rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[2px]">
            Live List
          </span>
        </div>

        {isLoading && <p className="text-sm text-gray-400">Loading {componentType}...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!isLoading && !error && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-700/70 bg-[#050c1a]/82 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-xs uppercase tracking-[3px] text-gray-500">Selected Part</p>
                    {selectedItems.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleRemove(selectedItems[0].id)}
                        className="rounded-full border border-red-400/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[2px] text-red-100 transition hover:bg-red-500/20"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white" style={clampStyle(2)}>
                    {selectedLabel}
                  </div>
                  {selectedItems.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedItems.map((item, index) => (
                        <span
                          key={`${item.id}-${index}`}
                          className="relative inline-flex min-h-8 items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 pr-9 text-[11px] font-semibold uppercase tracking-[2px] text-sky-100"
                          title={item.display_name || item.name}
                        >
                          <span className="block max-w-full" style={clampStyle(1)}>{item.display_name || item.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemove(item.id);
                            }}
                            className="absolute right-1 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-red-400/30 bg-red-500/20 text-[10px] font-black text-red-100 transition hover:bg-red-500/35"
                            aria-label={`Remove ${item.display_name || item.name}`}
                            title={removeOneText}
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setIsBrowserOpen(true)}
                  className="primary-glow-button inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition hover:translate-y-[-1px]"
                >
                  Browse Full List
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-700/70 bg-[#071121]/76 px-3 py-2">
                  <div className="text-slate-500">Results</div>
                  <div className="mt-1 font-semibold text-white">{filteredComponents.length}</div>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-[#071121]/76 px-3 py-2">
                  <div className="text-slate-500">Sort</div>
                  <div className="mt-1 font-semibold text-white">
                    {sortOrder === 'price_asc' ? 'Low to High' : sortOrder === 'price_desc' ? 'High to Low' : 'A-Z'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-[#071121]/76 px-3 py-2">
                  <div className="text-slate-500">Currency</div>
                  <div className="mt-1 font-semibold text-white">$</div>
                </div>
                <div className="rounded-xl border border-slate-700/70 bg-[#071121]/76 px-3 py-2">
                  <div className="text-slate-500">Brand Filter</div>
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
                className="w-full rounded-xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
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
                className="w-full rounded-xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
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
                className="w-full rounded-xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max price"
                className="w-full rounded-xl border border-slate-700/70 bg-[#05080d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[#020817]">
          <div className="border-b border-slate-700/70 bg-[#020817] px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[4px] text-sky-300">
                  {componentType} Catalog
                </p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  Choose a part from the full-screen list
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {filteredComponents.length.toLocaleString()} products, sorted by {sortOrder.replace('_', ' ')}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowserOpen(false)}
                className="secondary-glow-button rounded-xl px-4 py-2 text-sm font-semibold transition hover:border-sky-300/20 hover:bg-sky-500/5"
              >
                Close
              </button>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1800px] min-h-0 flex-1 flex-col gap-5 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${componentType.toLowerCase()}...`}
                className="w-full rounded-2xl border border-slate-700/70 bg-[#061120]/90 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-2xl border border-slate-700/70 bg-[#061120]/90 px-4 py-4 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-700/70 bg-[#061120]/90 px-4 py-4 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
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
                  className="w-full rounded-2xl border border-slate-700/70 bg-[#061120]/90 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max price"
                  className="w-full rounded-2xl border border-slate-700/70 bg-[#061120]/90 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
              </div>
            </div>

            <div
              ref={browserListRef}
              className="custom-scrollbar min-h-0 flex-1 overscroll-contain overflow-y-scroll pr-3"
              style={{ scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch' }}
              tabIndex={0}
              onWheel={handleBrowserListWheel}
            >
              {filteredComponents.length === 0 ? (
                  <div className="crystal-card grid min-h-[50vh] place-items-center rounded-[28px] border border-dashed border-slate-700/70 bg-[#071121]/72 p-8 text-center">
                  <div>
                    <div className="text-2xl font-black text-white">No products found</div>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                      This category currently has no matching live items. Try clearing filters or picking another search term.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredComponents.map((component) => {
                    const displayName = compactText(component.display_name || component.name);
                    const isSelected = selectedItems.some((item) => String(item.id) === String(component.id));
                    const selectedCount = selectedItems.filter((item) => String(item.id) === String(component.id)).length;

                    return (
                      <div
                        key={component.id}
                        className={`crystal-card group relative rounded-[28px] border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(0,180,255,0.12)] ${
                          isSelected
                            ? 'border-sky-400/36 bg-sky-400/10'
                            : 'border-slate-700/70 bg-[#06101f]/82 hover:border-sky-400/24 hover:bg-[#09152a]'
                        }`}
                      >
                        {isSelected && isMulti ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemove(component.id);
                            }}
                          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 text-sm font-black text-red-100 transition hover:bg-red-500/30"
                            aria-label={`Remove ${displayName}`}
                            title="Remove one"
                          >
                            x
                          </button>
                        ) : null}

                        <div className="mb-4 flex items-start justify-between gap-3 pr-8">
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
                          <div className="shrink-0 rounded-full border border-slate-700/70 bg-[#050c1b] px-3 py-1 text-[11px] font-semibold uppercase tracking-[2px] text-slate-300">
                            {component.category}
                          </div>
                        </div>

                        <div className="mb-4 rounded-2xl border border-slate-700/70 bg-[#050c1b] p-3">
                          <div className="text-xs uppercase tracking-[3px] text-slate-500">Price</div>
                          <div className="mt-1 text-2xl font-black text-sky-300">{formatPrice(component.price)}</div>
                          <div className="mt-1 text-[11px] text-slate-500">Live Newegg price</div>
                        </div>

                        {component.description ? (
                          <div
                            className="mb-4 rounded-2xl border border-slate-700/70 bg-[#071121]/70 p-3 text-sm leading-6 text-slate-300"
                            style={clampStyle(3)}
                          >
                            {component.description}
                          </div>
                        ) : null}

                        <div className="mb-4 text-xs uppercase tracking-[3px] text-slate-500">
                          {component.availability || 'Availability unknown'}
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                            {isMulti ? (selectedCount > 0 ? 'Add +1' : 'Add to build') : 'Select to add'}
                          </span>
                          <div className="flex items-center gap-2">
                            {isSelected && isMulti ? (
                              <button
                                type="button"
                                onClick={() => handleRemove(component.id)}
                                className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-500/20"
                              >
                                {removeOneText}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleSelect(component)}
                              className="primary-glow-button rounded-xl px-3 py-2 text-xs font-bold"
                            >
                              {isSelected && isMulti ? `Added x${selectedCount}` : 'Choose'}
                            </button>
                          </div>
                        </div>
                      </div>
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
