// pages/api/components/[type].js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../pc_builder_db.sqlite');

function normalizeCategory(value) {
  return String(value || '')
    .replace(/-/g, ' ')
    .trim()
    .toUpperCase();
}

function parseSpecs(specsValue) {
  if (!specsValue) {
    return {};
  }

  if (typeof specsValue === 'object') {
    return specsValue;
  }

  if (typeof specsValue !== 'string') {
    return {};
  }

  try {
    const parsed = JSON.parse(specsValue);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  const { type } = req.query;

  if (!type) {
    return res.status(400).json({ message: 'Component type is required.' });
  }

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const rows = await db.all(
      `
      SELECT
        c.id,
        c.name,
        c.category,
        c.specs,
        COALESCE(MIN(rp.price), 0) AS min_price
      FROM components c
      LEFT JOIN retailer_prices rp ON c.id = rp.component_id
      WHERE UPPER(c.category) = ?
      GROUP BY c.id, c.name, c.category, c.specs
      ORDER BY c.name ASC
      `,
      [normalizeCategory(type)]
    );

    await db.close();

    const components = rows.map((row) => {
      const specs = parseSpecs(row.specs);
      const minPrice = Number(row.min_price || 0);

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        component_type: row.category,
        price: minPrice,
        min_price: minPrice,
        specs,
        ...specs,
      };
    });

    res.status(200).json(components);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
