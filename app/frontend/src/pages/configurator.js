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
  const [isSavingBuild, setIsSavingBuild] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('Select at least CPU, GPU, Motherboard, and RAM to analyze.');
  const [saveStatus, setSaveStatus] = useState('');
  const [buildName, setBuildName] = useState('My PC Build');

  const handleComponentSelect = useCallback((componentType, component) => {
    setSelectedComponents((prev) => {
      if (prev[componentType]?.id === component.id) {
        return prev;
      }
      return { ...prev, [componentType]: component };
    });
  }, []);

  const handleSaveBuild = useCallback(async () => {
    setIsSavingBuild(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/save-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build_name: buildName.trim() || 'My PC Build',
          total_price: totalPrice,
          selected_components: selectedComponents,
          compatibility_issues: compatibilityIssues,
          bottleneck_score: bottleneckScore,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save build.');
      }

      setSaveStatus(`Saved successfully as build #${data.build_id}.`);
    } catch (error) {
      console.error('Error saving build:', error);
      setSaveStatus(error.message || 'Failed to save build.');
    } finally {
      setIsSavingBuild(false);
    }
  }, [buildName, bottleneckScore, compatibilityIssues, selectedComponents, totalPrice]);

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

      <div className="min-h-screen overflow-hidden bg-[#020406] px-4 py-8 text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(0,120,255,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(16,255,160,0.14),transparent_28%),linear-gradient(to_bottom,#020406,#010101)]" />
        <div className="fixed left-10 top-16 h-[2px] w-80 rotate-[-24deg] bg-gradient-to-r from-blue-500 to-emerald-400 opacity-60 blur-sm" />
        <div className="fixed bottom-12 right-12 h-[2px] w-80 rotate-[18deg] bg-gradient-to-r from-blue-500 to-emerald-400 opacity-60 blur-sm" />

        <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl md:p-8 lg:p-10">
          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[4px] text-cyan-400">Build Configurator</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">
                Build your custom PC
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                Select parts from live retailer data, compare pricing in real time, and get compatibility feedback before you buy.
              </p>
              <div className="mt-5 max-w-md">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[3px] text-gray-400">
                  Build Name
                </label>
                <input
                  type="text"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Enter build name"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-black/40 px-4 py-4 text-sm text-gray-300 shadow-[0_0_30px_rgba(0,180,255,0.08)]">
              <div className="text-xs uppercase tracking-[3px] text-cyan-400">Analysis Status</div>
              <div className="mt-2 leading-relaxed">{analysisStatus}</div>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 shadow-[0_0_20px_rgba(0,0,0,0.18)]">
              <div className="text-xs uppercase tracking-[3px] text-gray-400">Selected Parts</div>
              <div className="mt-2 text-2xl font-black">{Object.keys(selectedComponents).length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 shadow-[0_0_20px_rgba(0,0,0,0.18)]">
              <div className="text-xs uppercase tracking-[3px] text-gray-400">Estimated Total</div>
              <div className="mt-2 text-2xl font-black">৳ {Number(totalPrice).toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 shadow-[0_0_20px_rgba(0,0,0,0.18)]">
              <div className="text-xs uppercase tracking-[3px] text-gray-400">Bottleneck</div>
              <div className="mt-2 text-2xl font-black">
                {bottleneckScore !== null ? `${Number(bottleneckScore).toFixed(1)}/100` : '--'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
            <div className="rounded-[24px] border border-white/10 bg-black/35 p-5 shadow-[0_0_40px_rgba(0,180,255,0.05)] lg:col-span-2 md:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Select Components</h2>
                  <p className="mt-1 text-sm text-gray-400">Pricing updates from SQLite</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[2px] text-cyan-300">
                  Live Catalog
                </span>
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

            <div className="lg:col-span-1 lg:sticky lg:top-6">
              <BuildSummary
                selectedComponents={selectedComponents}
                totalPrice={totalPrice}
                compatibilityIssues={compatibilityIssues}
                bottleneckScore={bottleneckScore}
                isLoadingBuild={isLoadingBuild}
                onSaveBuild={handleSaveBuild}
                isSavingBuild={isSavingBuild}
                saveStatus={saveStatus}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BuildConfiguratorPage;
