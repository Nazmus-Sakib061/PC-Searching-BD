// pages/api/bottleneck-calculator.js

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { components } = req.body;

  // Placeholder logic for bottleneck calculation
  // In a real app, this would use a complex algorithm based on component specs
  const bottleneck_score = Math.floor(Math.random() * 20) + 80; // Dummy score between 80-100
  const compatibility_issues = [];

  // Simple compatibility check
  if (components.CPU && components.Motherboard && components.CPU.socket_type !== components.Motherboard.socket_type) {
    compatibility_issues.push({ message: `Socket mismatch: CPU (${components.CPU.socket_type}) and Motherboard (${components.Motherboard.socket_type}) are incompatible.` });
  }

  res.status(200).json({
    bottleneck_score,
    compatibility_issues
  });
}
