// pages/api/components/[type].js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Database path (Note: adjusted to reach the db in the root dir)
const dbPath = path.resolve(process.cwd(), '../../pc_builder_db.sqlite');

export default async function handler(req, res) {
  const { type } = req.query;

  // Map URL types to DB table names
  const typeTableMap = {
    'cpu': 'cpus',
    'gpu': 'gpus',
    'motherboard': 'motherboards',
    'ram': 'rams',
    'storage': 'storage_devices',
    'psu': 'psus',
    'case': 'pc_cases',
    'cpu-cooler': 'cpu_coolers'
  };

  const tableName = typeTableMap[type.toLowerCase()];

  if (!tableName) {
    return res.status(404).json({ message: 'Component type not supported' });
  }

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const components = await db.all(`SELECT * FROM ${tableName}`);
    await db.close();

    res.status(200).json(components);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
