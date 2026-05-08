import React from 'react';

function BuildSummary({ selectedComponents, totalPrice, compatibilityIssues, bottleneckScore, isLoadingBuild }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-semibold">Your Build Summary</h2>

      <div className="mb-4 max-h-60 overflow-y-auto pr-2">
        {Object.entries(selectedComponents).map(([type, comp]) => (
          comp && comp.name !== `Select ${type}` && comp.price > 0 && (
            <div key={type} className="flex justify-between border-b border-gray-200 py-2">
              <span>{comp.name}</span>
              <span>৳ {Number(comp.price).toLocaleString()}</span>
            </div>
          )
        ))}
      </div>

      <div className="mt-4 border-t border-gray-300 pt-4">
        <div className="flex justify-between text-xl font-bold">
          <span>Total Price:</span>
          <span>৳ {Number(totalPrice).toLocaleString()}</span>
        </div>
      </div>

      {compatibilityIssues && compatibilityIssues.length > 0 && (
        <div className="mt-4 rounded-md border border-red-400 bg-red-100 p-3 text-red-700">
          <h3 className="font-semibold">Compatibility Issues:</h3>
          <ul>
            {compatibilityIssues.map((issue, index) => (
              <li key={index} className="ml-5 list-disc">
                {issue.message || issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoadingBuild && <p className="mt-4 text-center text-blue-600">Calculating build performance...</p>}

      {bottleneckScore !== null && !isLoadingBuild && (
        <div className="mt-4 rounded-md border border-blue-400 bg-blue-100 p-3 text-blue-700">
          <h3 className="font-semibold">Bottleneck Score: {Number(bottleneckScore).toFixed(1)}/10</h3>
          <p>Analysis based on component balance.</p>
        </div>
      )}

      <button
        className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 text-lg font-bold text-white transition duration-300 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={totalPrice === 0 || (compatibilityIssues && compatibilityIssues.length > 0) || isLoadingBuild}
      >
        Save Build
      </button>
    </div>
  );
}

export default BuildSummary;
