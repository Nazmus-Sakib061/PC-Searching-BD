import React from 'react';

function clampStyle(lines = 2) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };
}

function normalizeSelections(selectedComponents) {
  return Object.entries(selectedComponents).flatMap(([type, comp]) => {
    if (Array.isArray(comp)) {
      return comp
        .filter((item) => item && item.price > 0 && item.name !== `Select ${type}`)
        .map((item, index) => ({ type, comp: item, index }));
    }

    if (comp && comp.name !== `Select ${type}` && comp.price > 0) {
      return [{ type, comp, index: 0 }];
    }

    return [];
  });
}

function parseNumber(value) {
  const match = String(value || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function readMetric(source, keys) {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const directValue = source[key];
    if (directValue !== undefined && directValue !== null && directValue !== '') {
      return directValue;
    }
  }

  const specs = source.specs && typeof source.specs === 'object' ? source.specs : null;
  if (!specs) {
    return null;
  }

  for (const key of keys) {
    const specValue = specs[key];
    if (specValue !== undefined && specValue !== null && specValue !== '') {
      return specValue;
    }
  }

  const specFields = specs.spec_fields && typeof specs.spec_fields === 'object' ? specs.spec_fields : null;
  if (!specFields) {
    return null;
  }

  for (const key of keys) {
    const fieldValue = specFields[key];
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      return fieldValue;
    }
  }

  return null;
}

function firstOf(value) {
  return Array.isArray(value) ? value.filter(Boolean)[0] || null : value || null;
}

function estimatePowerScore(selectedComponents) {
  const cpu = firstOf(selectedComponents.CPU);
  const motherboard = firstOf(selectedComponents.Motherboard);
  const psu = firstOf(selectedComponents.PSU);
  const gpuItems = Array.isArray(selectedComponents.GPU) ? selectedComponents.GPU.filter(Boolean) : firstOf(selectedComponents.GPU) ? [firstOf(selectedComponents.GPU)] : [];
  const ramItems = Array.isArray(selectedComponents.RAM) ? selectedComponents.RAM.filter(Boolean) : firstOf(selectedComponents.RAM) ? [firstOf(selectedComponents.RAM)] : [];
  const storageItems = Array.isArray(selectedComponents.Storage) ? selectedComponents.Storage.filter(Boolean) : firstOf(selectedComponents.Storage) ? [firstOf(selectedComponents.Storage)] : [];

  const cpuCores = parseNumber(readMetric(cpu, ['cores', 'core_count']));
  const cpuThreads = parseNumber(readMetric(cpu, ['threads', 'thread_count']));
  const gpuVram = gpuItems.reduce(
    (best, item) => Math.max(best, parseNumber(readMetric(item, ['vram_gb', 'memory_gb', 'memory_size_gb']))),
    0
  );
  const ramGb = ramItems.reduce(
    (total, item) => total + parseNumber(readMetric(item, ['capacity_gb', 'size_gb', 'memory_size_gb'])),
    0
  );
  const storageGb = storageItems.reduce(
    (total, item) => total + parseNumber(readMetric(item, ['capacity_gb', 'size_gb', 'storage_gb'])),
    0
  );
  const wattage = parseNumber(readMetric(psu, ['wattage_w', 'wattage', 'power_w']));
  const socketHint = String(
    readMetric(cpu, ['socket_type', 'socket', 'cpu_socket']) || readMetric(motherboard, ['socket_type', 'socket', 'cpu_socket']) || ''
  ).toUpperCase();

  let score = 0;
  score += Math.min(30, cpuCores * 2.25);
  score += Math.min(15, cpuThreads * 0.75);
  score += Math.min(30, gpuVram * 3);
  score += Math.min(15, ramGb * 1.1);
  score += Math.min(5, storageGb / 512);
  score += Math.min(10, wattage / 90);

  if (socketHint.includes('AM5') || socketHint.includes('LGA1700') || socketHint.includes('LGA1851')) {
    score += 4;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getPowerLabel(score) {
  if (score >= 80) return 'extreme';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'slow';
}

function BuildSummary({
  selectedComponents,
  totalPrice,
  compatibilityIssues,
  bottleneckScore,
  performanceScore,
  performanceLabel,
  suggestions,
  isLoadingBuild,
  onRemoveComponent,
  onSaveBuild,
  isSavingBuild,
  saveStatus,
}) {
  const entries = normalizeSelections(selectedComponents);
  const hasSelectedParts = entries.length > 0;
  const powerScore = performanceScore ?? estimatePowerScore(selectedComponents);
  const powerLabel = performanceLabel || getPowerLabel(powerScore);
  const barWidth = Math.max(6, powerScore);
  const barGradient =
    powerScore >= 80
      ? 'linear-gradient(90deg, #7dd3fc 0%, #38bdf8 45%, #2563eb 100%)'
      : powerScore >= 55
        ? 'linear-gradient(90deg, #60a5fa 0%, #38bdf8 55%, #2563eb 100%)'
        : powerScore >= 30
          ? 'linear-gradient(90deg, #3b82f6 0%, #38bdf8 55%, #0ea5e9 100%)'
          : 'linear-gradient(90deg, #64748b 0%, #94a3b8 55%, #cbd5e1 100%)';

  return (
    <div className="surface-shell sticky top-6 rounded-[24px] p-5 md:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-sky-300">Build Summary</p>
        <h2 className="mt-2 text-2xl font-black text-slate-50">Your selected parts</h2>
      </div>

      <div className="custom-scrollbar mb-4 max-h-[26rem] overflow-y-auto pr-2">
        {!hasSelectedParts && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-300">No components selected yet.</p>
            <p className="mt-2 text-xs text-gray-500">Choose parts from the catalog to build your PC.</p>
          </div>
        )}

        {entries.map(({ type, comp, index }) => (
          <div key={`${type}-${comp.id || index}`} className="flex items-start justify-between gap-4 border-b border-slate-700/70 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold leading-5 text-white" style={clampStyle(2)}>
                {comp.display_name || comp.name}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[2px] text-gray-400">
                {type}
                {Array.isArray(selectedComponents[type]) ? ` #${index + 1}` : ''}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {typeof onRemoveComponent === 'function' ? (
                <button
                  type="button"
                  onClick={() => onRemoveComponent(type, comp.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-xs font-black text-red-100 transition hover:bg-red-500/20"
                  aria-label={`Remove ${comp.display_name || comp.name}`}
                  title="Remove one"
                >
                  x
                </button>
              ) : null}
              <span className="shrink-0 text-sm font-semibold text-sky-300">
                ${Number(comp.price).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-700/70 pt-4">
        <div className="flex justify-between text-xl font-black text-white">
          <span>Total Price</span>
          <span className="text-sky-300">${Number(totalPrice).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-700/70 bg-[#071122]/78 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[3px] text-slate-500">Performance Meter</div>
            <div className="mt-1 text-base font-semibold text-white capitalize">{powerLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{powerScore}</div>
            <div className="text-[10px] uppercase tracking-[3px] text-slate-500">Power</div>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800/90">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%`, background: barGradient }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[2px] text-slate-500">
          <span>Slow</span>
          <span>Medium</span>
          <span>High</span>
          <span>Extreme</span>
        </div>
      </div>

      {compatibilityIssues && compatibilityIssues.length > 0 && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <h3 className="font-semibold text-red-100">Compatibility Issues</h3>
          <ul>
            {compatibilityIssues.map((issue, index) => (
              <li key={index} className="ml-5 list-disc">
                {issue.message || issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sky-50">
          <h3 className="font-semibold text-sky-100">Suggestions</h3>
          <ul className="mt-2 space-y-2">
            {suggestions.map((item, index) => (
              <li key={index} className="rounded-xl border border-slate-700/70 bg-[#040c18] px-3 py-2 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoadingBuild && <p className="mt-4 text-center text-sky-300">Calculating build performance...</p>}

      {bottleneckScore !== null && !isLoadingBuild && (
        <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sky-100">
          <h3 className="text-sm font-semibold">Bottleneck Score: {Number(bottleneckScore).toFixed(1)}/100</h3>
          <p className="mt-1 text-[13px] text-cyan-100/80">Analysis based on component balance.</p>
        </div>
      )}

      <button
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-6 py-3 text-sm font-bold text-black transition duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onSaveBuild}
        disabled={totalPrice === 0 || (compatibilityIssues && compatibilityIssues.length > 0) || isLoadingBuild || isSavingBuild}
      >
        {isSavingBuild ? 'Saving Build...' : 'Save Build'}
      </button>

      {saveStatus && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] text-gray-200">
          {saveStatus}
        </div>
      )}
    </div>
  );
}

export default BuildSummary;
