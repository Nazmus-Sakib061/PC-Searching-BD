// pages/api/products/[id].js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../../pc_builder_db.sqlite');

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const component = await db.get('SELECT * FROM components WHERE id = ?', [id]);
    const prices = await db.all('SELECT * FROM retailer_prices WHERE component_id = ?', [id]);

    await db.close();

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.status(200).json({ ...component, prices });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
