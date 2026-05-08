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

  if (cpu.socket_type && motherboard.socket_type && cpu.socket_type !== motherboard.socket_type) {
    compatibility_issues.push({
      message: `Socket mismatch: CPU (${cpu.socket_type}) and Motherboard (${motherboard.socket_type}) are incompatible.`,
    });
    score -= 35;
  }

  if (motherboard.ram_type && ram.type && motherboard.ram_type !== ram.type) {
    compatibility_issues.push({
      message: `RAM mismatch: Motherboard supports ${motherboard.ram_type} but selected RAM is ${ram.type}.`,
    });
    score -= 25;
  }

  const cpuCores = Number(cpu.cores || 0);
  const gpuVram = Number(gpu.vram_gb || 0);
  const ramCapacity = Number(ram.capacity_gb || 0);
  const psuWattage = Number(psu.wattage_w || 0);

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
