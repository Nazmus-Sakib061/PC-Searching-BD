import React from 'react';

function BuildSummary({
  selectedComponents,
  totalPrice,
  compatibilityIssues,
  bottleneckScore,
  isLoadingBuild,
  onSaveBuild,
  isSavingBuild,
  saveStatus,
}) {
  const hasSelectedParts = Object.entries(selectedComponents).some(
    ([type, comp]) => comp && comp.name !== `Select ${type}` && comp.price > 0
  );

  return (
    <div className="sticky top-6 rounded-[24px] border border-cyan-500/20 bg-black/35 p-5 shadow-[0_0_40px_rgba(0,180,255,0.05)] backdrop-blur-sm md:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-emerald-300">Build Summary</p>
        <h2 className="mt-2 text-2xl font-black text-white">Your selected parts</h2>
      </div>

      <div className="mb-4 max-h-[26rem] overflow-y-auto pr-1">
        {!hasSelectedParts && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-300">No components selected yet.</p>
            <p className="mt-2 text-xs text-gray-500">Choose parts from the catalog to build your PC.</p>
          </div>
        )}

        {Object.entries(selectedComponents).map(([type, comp]) => (
          comp && comp.name !== `Select ${type}` && comp.price > 0 && (
            <div key={type} className="flex items-start justify-between gap-4 border-b border-white/10 py-3">
              <div>
                <div className="text-sm font-semibold text-white">{comp.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[2px] text-gray-400">{type}</div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-emerald-300">$ {Number(comp.price).toLocaleString()}</span>
            </div>
          )
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex justify-between text-xl font-black text-white">
          <span>Total Price</span>
          <span className="text-emerald-300">$ {Number(totalPrice).toLocaleString()}</span>
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

      {isLoadingBuild && <p className="mt-4 text-center text-cyan-300">Calculating build performance...</p>}

      {bottleneckScore !== null && !isLoadingBuild && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-100">
          <h3 className="font-semibold">Bottleneck Score: {Number(bottleneckScore).toFixed(1)}/100</h3>
          <p className="mt-1 text-sm text-cyan-100/80">Analysis based on component balance.</p>
        </div>
      )}

      <button
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-400 px-6 py-3 text-lg font-bold text-black transition duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onSaveBuild}
        disabled={totalPrice === 0 || (compatibilityIssues && compatibilityIssues.length > 0) || isLoadingBuild || isSavingBuild}
      >
        {isSavingBuild ? 'Saving Build...' : 'Save Build'}
      </button>

      {saveStatus && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-200">
          {saveStatus}
        </div>
      )}
    </div>
  );
}

export default BuildSummary;
