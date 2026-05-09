// pages/api/products/[id].js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../pc_builder_db.sqlite');

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const component = await db.get('SELECT * FROM components WHERE id = ?', [id]);

    if (!component) {
      await db.close();
      return res.status(404).json({ message: 'Component not found' });
    }

    const prices = await db.all(
      'SELECT id, component_id, retailer_name, price, url, updated_at FROM retailer_prices WHERE component_id = ? ORDER BY price ASC',
      [id]
    );

    await db.close();

    res.status(200).json({
      ...component,
      category: component.category,
      component_type: component.product_type || component.category,
      prices,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
