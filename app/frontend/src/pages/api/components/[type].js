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
  const sort = String(req.query.sort || 'price_asc').toLowerCase();
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  const brand = String(req.query.brand || '').trim().toLowerCase();
  const search = String(req.query.q || '').trim().toLowerCase();

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
      WITH priced_components AS (
        SELECT
          c.id,
          c.source_name,
          c.product_type,
          c.name,
          c.brand,
          c.model,
          c.category,
          c.specs,
          c.image_url,
          c.product_url,
          c.availability,
          COALESCE(MIN(rp.price), 0) AS min_price
        FROM components c
        LEFT JOIN retailer_prices rp ON c.id = rp.component_id
        WHERE UPPER(c.category) = ?
        GROUP BY
          c.id, c.source_name, c.product_type, c.name, c.brand, c.model,
          c.category, c.specs, c.image_url, c.product_url, c.availability
      )
      SELECT *
      FROM priced_components
      WHERE (? IS NULL OR min_price >= ?)
        AND (? IS NULL OR min_price <= ?)
        AND (? = '' OR LOWER(COALESCE(brand, '')) LIKE ?)
        AND (? = '' OR LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(specs) LIKE ?)
      ORDER BY
        CASE WHEN ? = 'price_desc' THEN min_price END DESC,
        CASE WHEN ? = 'name_desc' THEN name END DESC,
        CASE WHEN ? = 'name_asc' THEN name END ASC,
        min_price ASC,
        name ASC
      `,
      [
        normalizeCategory(type),
        minPrice,
        minPrice,
        maxPrice,
        maxPrice,
        brand,
        brand ? `%${brand}%` : '',
        search,
        search ? `%${search}%` : '',
        search ? `%${search}%` : '',
        search ? `%${search}%` : '',
        sort,
        sort,
        sort,
      ]
    );

    await db.close();

    const components = rows.map((row) => {
      const specs = parseSpecs(row.specs);
      const minPrice = Number(row.min_price || 0);

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        component_type: row.product_type || row.category,
        source_name: row.source_name,
        price: minPrice,
        min_price: minPrice,
        image_url: row.image_url || null,
        product_url: row.product_url || null,
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
