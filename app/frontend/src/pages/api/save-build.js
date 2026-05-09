import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '..', '..', 'pc_builder_db.sqlite');

async function ensureTables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS saved_builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_name TEXT NOT NULL,
      total_price REAL NOT NULL,
      build_json TEXT NOT NULL,
      compatibility_json TEXT NOT NULL,
      bottleneck_score REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    build_name: buildName,
    total_price: totalPrice,
    selected_components: selectedComponents,
    compatibility_issues: compatibilityIssues,
    bottleneck_score: bottleneckScore,
  } = req.body || {};

  if (!buildName || !selectedComponents) {
    return res.status(400).json({ message: 'build_name and selected_components are required.' });
  }

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await ensureTables(db);

    const result = await db.run(
      `
      INSERT INTO saved_builds (
        build_name,
        total_price,
        build_json,
        compatibility_json,
        bottleneck_score
      ) VALUES (?, ?, ?, ?, ?)
      `,
      [
        buildName,
        Number(totalPrice || 0),
        JSON.stringify(selectedComponents),
        JSON.stringify(compatibilityIssues || []),
        bottleneckScore === null || bottleneckScore === undefined ? null : Number(bottleneckScore),
      ]
    );

    await db.close();

    res.status(200).json({
      message: 'Build saved successfully.',
      build_id: result.lastID,
    });
  } catch (error) {
    console.error('Save build error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
