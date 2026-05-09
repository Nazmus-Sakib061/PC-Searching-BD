import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '..', '..', 'pc_builder_db.sqlite');

const RETAILER_ALIASES = {
  ryans: 'Ryans Computers',
  'ryans computers': 'Ryans Computers',
  'star tech': 'Star Tech',
  'tech land bd': 'Tech Land BD',
};

function normalizeRetailerName(name) {
  const raw = String(name || '').trim();
  const canonical = RETAILER_ALIASES[raw.toLowerCase()];
  return canonical || raw;
}

function compactDisplayName(name) {
  let value = String(name || '').replace(/\s+/g, ' ').trim();
  if (!value) {
    return 'Unnamed Product';
  }

  value = value
    .replace(/^Model #:\s*/i, '')
    .replace(/^REFURBISHED\s+/i, '')
    .replace(/\*\s*Save:.*$/i, '')
    .trim();

  if (value.length > 88) {
    value = `${value.slice(0, 85).trim()}...`;
  }

  return value;
}

function formatSpecsSummary(specsValue) {
  if (!specsValue) {
    return '';
  }

  let specs = specsValue;
  if (typeof specsValue === 'string') {
    try {
      specs = JSON.parse(specsValue);
    } catch {
      return specsValue;
    }
  }

  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) {
    return String(specsValue);
  }

  const preferredKeys = [
    'socket_type',
    'socket',
    'cores',
    'threads',
    'vram_gb',
    'capacity_gb',
    'wattage_w',
    'price',
    'form_factor',
    'ram_type',
    'pcie_version',
  ];

  const entries = [];

  preferredKeys.forEach((key) => {
    if (specs[key] !== undefined && specs[key] !== null && specs[key] !== '') {
      entries.push(`${key.replace(/_/g, ' ')}: ${specs[key]}`);
    }
  });

  Object.entries(specs).forEach(([key, value]) => {
    if (entries.length >= 5) {
      return;
    }
    if (preferredKeys.includes(key)) {
      return;
    }
    if (value !== undefined && value !== null && value !== '') {
      entries.push(`${key.replace(/_/g, ' ')}: ${value}`);
    }
  });

  return entries.join(', ');
}

export default async function handler(req, res) {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const rows = await db.all(
      `
      SELECT
        c.id,
        c.name,
        c.description,
        c.category,
        c.specs,
        rp.retailer_name,
        rp.price,
        rp.url,
        rp.updated_at
      FROM components c
      LEFT JOIN retailer_prices rp ON rp.component_id = c.id
      ORDER BY c.category ASC, c.name ASC, rp.price ASC
      `
    );

    await db.close();

    const itemMap = new Map();
    const retailerNameSet = new Set();

    rows.forEach((row) => {
      if (!itemMap.has(row.id)) {
        itemMap.set(row.id, {
          id: row.id,
          component: row.name,
          description: row.description || '',
          display_name: compactDisplayName(row.name),
          category: row.category,
          specs: formatSpecsSummary(row.specs),
          retailers: [],
        });
      }

      if (row.retailer_name) {
        const retailerName = normalizeRetailerName(row.retailer_name);
        retailerNameSet.add(retailerName);
        itemMap.get(row.id).retailers.push({
          name: retailerName,
          price: Number(row.price || 0),
          url: row.url || null,
          updated_at: row.updated_at || null,
        });
      }
    });

    const retailerNames = Array.from(retailerNameSet).sort((a, b) => a.localeCompare(b));
    const items = Array.from(itemMap.values()).sort((a, b) => {
      const categoryA = String(a.category || '');
      const categoryB = String(b.category || '');
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      return String(a.component || '').localeCompare(String(b.component || ''));
    });

    res.status(200).json({ retailerNames, items });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
