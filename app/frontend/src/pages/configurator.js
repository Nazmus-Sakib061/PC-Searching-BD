import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import ComponentSelector from '../components/ComponentSelector';
import BuildSummary from '../components/BuildSummary';

function BuildConfiguratorPage() {
  const [selectedComponents, setSelectedComponents] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [compatibilityIssues, setCompatibilityIssues] = useState([]);
  const [bottleneckScore, setBottleneckScore] = useState(null);
  const [isLoadingBuild, setIsLoadingBuild] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('Select at least CPU, GPU, Motherboard, and RAM to analyze.');

  const handleComponentSelect = useCallback((componentType, component) => {
    setSelectedComponents((prev) => {
      if (prev[componentType]?.id === component.id) {
        return prev;
      }
      return { ...prev, [componentType]: component };
    });
  }, []);

  useEffect(() => {
    let currentPrice = 0;
    const systemForAnalysis = {};

    Object.values(selectedComponents).forEach((comp) => {
      if (comp && Number(comp.price || 0) > 0) {
        currentPrice += Number(comp.price || 0);
      }

      if (comp && comp.component_type && comp.name !== `Select ${comp.component_type}`) {
        systemForAnalysis[comp.component_type] = comp;
      }
    });

    setTotalPrice(currentPrice);

    const hasCoreComponents =
      systemForAnalysis.CPU &&
      systemForAnalysis.GPU &&
      systemForAnalysis.Motherboard &&
      systemForAnalysis.RAM;

    if (!hasCoreComponents) {
      setCompatibilityIssues([]);
      setBottleneckScore(null);
      setIsLoadingBuild(false);
      setAnalysisStatus('Select at least CPU, GPU, Motherboard, and RAM to analyze.');
      return;
    }

    setIsLoadingBuild(true);
    setAnalysisStatus('Analyzing selected parts...');

    fetch('/api/bottleneck-calculator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ components: systemForAnalysis }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setBottleneckScore(data.bottleneck_score);
        setCompatibilityIssues(data.compatibility_issues || []);
        setAnalysisStatus(
          data.compatibility_issues && data.compatibility_issues.length > 0
            ? 'Compatibility issues found. Review the warnings below.'
            : 'No compatibility issues detected.'
        );
      })
      .catch((error) => {
        console.error('Error calculating bottleneck:', error);
        setCompatibilityIssues([
          { message: 'Could not calculate bottleneck score. Please check component compatibility manually.' },
        ]);
        setBottleneckScore(null);
        setAnalysisStatus('Analysis failed.');
      })
      .finally(() => {
        setIsLoadingBuild(false);
      });
  }, [selectedComponents]);

  const componentTypes = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'CPU Cooler'];

  return (
    <>
      <Head>
        <title>Build PC - PC Maker BD</title>
        <meta
          name="description"
          content="Select live component pricing and check build compatibility in one place."
        />
      </Head>

      <div className="min-h-screen bg-[#020406] px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[4px] text-cyan-400">Build Configurator</p>
              <h1 className="mt-2 text-4xl font-black md:text-5xl">Build your custom PC</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                Select parts from live retailer data, see estimated pricing, and check basic compatibility before you commit.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300">
              <div className="text-xs uppercase tracking-[3px] text-cyan-400">Analysis</div>
              <div className="mt-1">{analysisStatus}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/30 p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Select Components</h2>
                <span className="text-sm text-gray-400">Pricing updates from SQLite</span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {componentTypes.map((type) => (
                  <ComponentSelector
                    key={type}
                    componentType={type}
                    onSelectComponent={handleComponentSelect}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <BuildSummary
                selectedComponents={selectedComponents}
                totalPrice={totalPrice}
                compatibilityIssues={compatibilityIssues}
                bottleneckScore={bottleneckScore}
                isLoadingBuild={isLoadingBuild}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BuildConfiguratorPage;
