// pages/api/bottleneck-calculator.js

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { components } = req.body;

  if (!components || typeof components !== 'object') {
    return res.status(400).json({ message: 'components payload is required.' });
  }

  const compatibility_issues = [];
  const suggestions = [];
  let score = 100;

  const asArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : [value];
  };

  const pick = (source, keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    const specs = source?.specs;
    if (specs && typeof specs === 'object') {
      for (const key of keys) {
        const value = specs[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }

      const specFields = specs.spec_fields;
      if (specFields && typeof specFields === 'object') {
        for (const key of keys) {
          const value = specFields[key];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
      }
    }
    return null;
  };

  const firstOf = (value) => asArray(value)[0] || {};
  const bestOf = (items, metricKeys) => {
    const list = asArray(items);
    if (list.length === 0) {
      return {};
    }

    return list.reduce((best, current) => {
      const currentScore = parseNumber(pick(current, metricKeys));
      const bestScore = parseNumber(pick(best, metricKeys));
      return currentScore > bestScore ? current : best;
    }, list[0]);
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const match = String(value).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  };

  const parseText = (value) => String(value || '').toUpperCase();

  const readMetric = (source, keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    const specs = source?.specs;
    if (specs && typeof specs === 'object') {
      for (const key of keys) {
        const value = specs[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }

      const specFields = specs.spec_fields;
      if (specFields && typeof specFields === 'object') {
        for (const key of keys) {
          const value = specFields[key];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
      }
    }

    return null;
  };

  const cpu = firstOf(components.CPU);
  const motherboard = firstOf(components.Motherboard);
  const ramList = asArray(components.RAM);
  const gpuList = asArray(components.GPU);
  const psu = firstOf(components.PSU);
  const storageList = asArray(components.Storage);

  if (!cpu) {
    suggestions.push('Add a CPU to start the performance analysis.');
    score -= 15;
  }
  if (!motherboard) {
    suggestions.push('Add a motherboard so CPU and RAM compatibility can be checked.');
    score -= 15;
  }
  if (ramList.length === 0) {
    suggestions.push('Add RAM to get a realistic build score.');
    score -= 10;
  }
  if (gpuList.length === 0) {
    suggestions.push('Add a GPU for gaming or graphics performance analysis.');
    score -= 10;
  }

  const cpuSocket = readMetric(cpu, ['socket_type', 'socket', 'cpu_socket']);
  const motherboardSocket = readMetric(motherboard, ['socket_type', 'socket', 'cpu_socket']);
  if (cpuSocket && motherboardSocket && parseText(cpuSocket) !== parseText(motherboardSocket)) {
    compatibility_issues.push({
      message: `Socket mismatch: CPU (${cpuSocket}) and Motherboard (${motherboardSocket}) are incompatible.`,
    });
    suggestions.push(`Pick a motherboard with ${cpuSocket} socket, or change the CPU to match ${motherboardSocket}.`);
    score -= 35;
  }

  const motherboardRamType = readMetric(motherboard, ['ram_type', 'memory_type', 'type']);
  const ramPrimary = firstOf(ramList);
  const ramType = readMetric(ramPrimary, ['type', 'ram_type', 'memory_type']);
  if (motherboardRamType && ramType && parseText(motherboardRamType) !== parseText(ramType)) {
    compatibility_issues.push({
      message: `RAM mismatch: Motherboard supports ${motherboardRamType} but selected RAM is ${ramType}.`,
    });
    suggestions.push(`Use ${motherboardRamType} RAM, or change the motherboard to match your selected RAM type.`);
    score -= 25;
  }

  const cpuCores = parseNumber(readMetric(cpu, ['cores', 'core_count']));
  const cpuThreads = parseNumber(readMetric(cpu, ['threads', 'thread_count']));
  const gpuPrimary = bestOf(gpuList, ['vram_gb', 'memory_gb', 'memory_size_gb']);
  const gpuVram = parseNumber(readMetric(gpuPrimary, ['vram_gb', 'memory_gb', 'memory_size_gb']));
  const ramCapacity = ramList.reduce((total, item) => total + parseNumber(readMetric(item, ['capacity_gb', 'size_gb', 'memory_size_gb'])), 0);
  const psuWattage = parseNumber(readMetric(psu, ['wattage_w', 'wattage', 'power_w']));
  const storageCapacity = storageList.reduce((total, item) => total + parseNumber(readMetric(item, ['capacity_gb', 'size_gb', 'storage_gb'])), 0);

  if (cpuCores > 0 && gpuVram > 0) {
    const balanceGap = Math.abs((cpuCores * 2) - gpuVram);
    score -= Math.min(15, balanceGap * 1.5);

    if (balanceGap > 8) {
      suggestions.push('CPU and GPU balance looks uneven. Pair a stronger GPU with more cores, or a lighter GPU with this CPU.');
    }
  }

  if (ramCapacity > 0 && ramCapacity < 16) {
    suggestions.push('At least 16GB RAM is recommended for smoother performance.');
    score -= 10;
  }

  if (ramList.length > 1) {
    const ramTypes = Array.from(
      new Set(
        ramList
          .map((item) => parseText(readMetric(item, ['type', 'ram_type', 'memory_type'])))
          .filter(Boolean)
      )
    );

    if (ramTypes.length > 1) {
      compatibility_issues.push({
        message: `Mixed RAM types detected: ${ramTypes.join(', ')}. Bottleneck analysis uses the combined memory capacity.`,
      });
      suggestions.push('Use one RAM type and speed family for the best stability and performance.');
      score -= 10;
    }
  }

  if (gpuList.length > 1) {
    compatibility_issues.push({
      message: 'Multiple GPUs selected. Bottleneck analysis uses the strongest GPU for balance scoring.',
    });
    suggestions.push('Multiple GPUs are usually unnecessary for this build unless you have a specific workload.');
    score -= 5;
  }

  if (storageCapacity > 0 && storageCapacity < 256) {
    compatibility_issues.push({
      message: `Storage capacity is low: total selected storage is ${storageCapacity}GB.`,
    });
    suggestions.push('Use at least 512GB storage for a more comfortable build.');
    score -= 5;
  }

  if (psuWattage > 0 && gpuVram > 0) {
    const recommendedWattage = 450 + (gpuVram * 12);
    if (psuWattage < recommendedWattage) {
      compatibility_issues.push({
        message: `PSU may be underpowered: selected ${psuWattage}W, estimated recommended is around ${recommendedWattage}W.`,
      });
      suggestions.push(`Upgrade to a PSU around ${recommendedWattage}W or above for stability.`);
      score -= 20;
    }
  }

  const missingCritical =
    (!cpu ? 1 : 0) +
    (!motherboard ? 1 : 0) +
    (ramList.length === 0 ? 1 : 0) +
    (gpuList.length === 0 ? 1 : 0);

  if (missingCritical > 0) {
    compatibility_issues.push({
      message: `Build is incomplete: ${missingCritical} major component group${missingCritical > 1 ? 's are' : ' is'} missing.`,
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let performance_score = 0;
  performance_score += Math.min(30, cpuCores * 2.25);
  performance_score += Math.min(15, cpuThreads * 0.75);
  performance_score += Math.min(30, gpuVram * 3);
  performance_score += Math.min(15, ramCapacity * 1.1);
  performance_score += Math.min(5, storageCapacity / 512);
  performance_score += Math.min(10, psuWattage / 90);
  performance_score = Math.max(0, Math.min(100, Math.round(performance_score)));

  const performance_label =
    performance_score >= 80 ? 'extreme' : performance_score >= 55 ? 'high' : performance_score >= 30 ? 'medium' : 'slow';

  res.status(200).json({
    bottleneck_score: score,
    performance_score,
    performance_label,
    compatibility_issues,
    suggestions: Array.from(new Set(suggestions)),
  });
}
