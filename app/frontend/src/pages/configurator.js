import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import ComponentSelector from '../components/ComponentSelector';
import BuildSummary from '../components/BuildSummary';
import SiteHeader from '../components/SiteHeader';

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
        <title>Build PC - PC Bottleneck Checker</title>
        <meta
          name="description"
          content="Select real PC parts and measure bottleneck, compatibility, and performance."
        />
      </Head>

      <div className="min-h-screen bg-[#020406] text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_16%,rgba(0,140,255,0.28),transparent_18%),radial-gradient(circle_at_86%_80%,rgba(80,255,150,0.20),transparent_18%),radial-gradient(circle_at_70%_12%,rgba(0,220,255,0.14),transparent_20%),linear-gradient(to_bottom,#010204,#020406_46%,#010101)]" />
        <div className="fixed inset-x-0 bottom-0 h-24 bg-[linear-gradient(90deg,rgba(0,140,255,0.18),transparent_20%,transparent_80%,rgba(80,255,150,0.20))] opacity-70" />
        <SiteHeader active="build" />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          <section className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_50px_rgba(0,180,255,0.08)] backdrop-blur-xl md:p-8">
              <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
                <div>
                  <p className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[4px] text-emerald-300">
                    Build Configurator
                  </p>
                  <h1 className="max-w-3xl text-2xl font-black leading-[1.02] md:text-4xl lg:text-5xl">
                    Design a clean build with live pricing and compatibility checks.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-gray-300">
                    Pick parts from the catalog, see totals update instantly, and save the final build when you are done.
                  </p>
                  <div className="mt-6 max-w-md">
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

                <div className="rounded-3xl border border-cyan-500/20 bg-black/35 p-5 shadow-[0_0_30px_rgba(0,180,255,0.08)]">
                  <div className="text-xs uppercase tracking-[4px] text-emerald-300">Analysis Status</div>
                  <div className="mt-2 text-sm leading-7 text-gray-300">{analysisStatus}</div>
                </div>
              </div>

              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs uppercase tracking-[3px] text-gray-400">Selected Parts</div>
                  <div className="mt-2 text-3xl font-black">{Object.keys(selectedComponents).length}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs uppercase tracking-[3px] text-gray-400">Estimated Total</div>
                  <div className="mt-2 text-3xl font-black">$ {Number(totalPrice).toLocaleString()}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs uppercase tracking-[3px] text-gray-400">Bottleneck</div>
                  <div className="mt-2 text-3xl font-black">
                    {bottleneckScore !== null ? `${Number(bottleneckScore).toFixed(1)}/100` : '--'}
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Select Components</h2>
                  <p className="mt-1 text-sm text-gray-400">Pricing updates from SQLite</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[2px] text-emerald-300">
                  Live Catalog
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                {componentTypes.map((type) => (
                  <ComponentSelector
                    key={type}
                    componentType={type}
                    onSelectComponent={handleComponentSelect}
                  />
                ))}
              </div>
            </div>

            <div className="xl:sticky xl:top-6 xl:self-start xl:justify-self-end xl:w-full xl:max-w-[420px]">
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
          </section>
        </main>
      </div>
    </>
  );
}

export default BuildConfiguratorPage;
