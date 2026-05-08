
// components/BuildSummary.js (Placeholder)
// This component will display the list of selected components, total price,
// compatibility warnings, and the bottleneck score.

import React from 'react';

function BuildSummary({ selectedComponents, totalPrice, compatibilityIssues, bottleneckScore, isLoadingBuild }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Your Build Summary</h2>
      <div className="mb-4 max-h-60 overflow-y-auto pr-2"> {/* Added max-height and overflow */}
        {Object.entries(selectedComponents).map(([type, comp]) => (
          comp && comp.name !== `Select ${type}` && comp.price > 0 && (
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
      
      {compatibilityIssues && compatibilityIssues.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <h3 className="font-semibold">Compatibility Issues:</h3>
          <ul>
            {compatibilityIssues.map((issue, index) => (
              <li key={index} className="list-disc ml-5">- {issue.message || issue}</li>
            ))}
          </ul>
        </div>
      )}

      {isLoadingBuild && <p className="text-center text-blue-600 mt-4">Calculating build performance...</p>}
      {bottleneckScore !== null && !isLoadingBuild && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-md">
          <h3 className="font-semibold">Bottleneck Score: {bottleneckScore.toFixed(1)}/10</h3>
          <p>Analysis based on component balance.</p>
        </div>
      )}

      <button className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={totalPrice === 0 || (compatibilityIssues && compatibilityIssues.length > 0) || isLoadingBuild}>
        Save Build
      </button>
    </div>
  );
}

export default BuildSummary;
