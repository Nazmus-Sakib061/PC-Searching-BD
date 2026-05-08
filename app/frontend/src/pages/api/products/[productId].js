
// pages/api/products/[productId].js
// This API route is a placeholder to fetch details for a specific product.
// In a real application, it would query the database based on productId.

import { mockComponents } from '../../../components/mockData'; // Assuming mockData is in components folder

export default function handler(req, res) {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  let foundProduct = null;
  // Search across all component types for the product ID
  for (const type in mockComponents) {
    const componentsOfType = mockComponents[type];
    const product = componentsOfType.find(p => p.id === parseInt(productId));
    if (product) {
      foundProduct = { ...product, component_type: type }; // Add type for context
      break;
    }
  }

  if (foundProduct) {
    res.status(200).json(foundProduct);
  } else {
    res.status(404).json({ message: `Product with ID ${productId} not found.` });
  }
}
