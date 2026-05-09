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
  let score = 100;

  const cpu = components.CPU || {};
  const motherboard = components.Motherboard || {};
  const ram = components.RAM || {};
  const gpu = components.GPU || {};
  const psu = components.PSU || {};

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
    }
    return null;
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const match = String(value).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  };

  const parseText = (value) => String(value || '').toUpperCase();

  const cpuSocket = pick(cpu, ['socket_type', 'socket', 'cpu_socket']);
  const motherboardSocket = pick(motherboard, ['socket_type', 'socket', 'cpu_socket']);
  if (cpuSocket && motherboardSocket && parseText(cpuSocket) !== parseText(motherboardSocket)) {
    compatibility_issues.push({
      message: `Socket mismatch: CPU (${cpuSocket}) and Motherboard (${motherboardSocket}) are incompatible.`,
    });
    score -= 35;
  }

  const motherboardRamType = pick(motherboard, ['ram_type', 'memory_type', 'type']);
  const ramType = pick(ram, ['type', 'ram_type', 'memory_type']);
  if (motherboardRamType && ramType && parseText(motherboardRamType) !== parseText(ramType)) {
    compatibility_issues.push({
      message: `RAM mismatch: Motherboard supports ${motherboardRamType} but selected RAM is ${ramType}.`,
    });
    score -= 25;
  }

  const cpuCores = parseNumber(pick(cpu, ['cores', 'core_count']));
  const gpuVram = parseNumber(pick(gpu, ['vram_gb', 'memory_gb', 'memory_size_gb']));
  const ramCapacity = parseNumber(pick(ram, ['capacity_gb', 'size_gb', 'memory_size_gb']));
  const psuWattage = parseNumber(pick(psu, ['wattage_w', 'wattage', 'power_w']));

  if (cpuCores > 0 && gpuVram > 0) {
    const balanceGap = Math.abs((cpuCores * 2) - gpuVram);
    score -= Math.min(15, balanceGap * 1.5);
  }

  if (ramCapacity > 0 && ramCapacity < 16) {
    score -= 10;
  }

  if (psuWattage > 0 && gpuVram > 0) {
    const recommendedWattage = 450 + (gpuVram * 12);
    if (psuWattage < recommendedWattage) {
      compatibility_issues.push({
        message: `PSU may be underpowered: selected ${psuWattage}W, estimated recommended is around ${recommendedWattage}W.`,
      });
      score -= 20;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  res.status(200).json({
    bottleneck_score: score,
    compatibility_issues,
  });
}
