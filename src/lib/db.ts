import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { ensureRuntimeStorage, getDatabasePath } from './storage';

ensureRuntimeStorage();
const dbPath = getDatabasePath();

// Global database connection cache to prevent multiple connections in dev hot-reloads
let globalDb: Database | null = null;

const LEGACY_COPY_UPDATES = [
  ["hero_btn2_text", "รู้จักกับเรา & ตำนานลับแล", "รู้จักบ้านและเรื่องเล่าลับแล"],
  ["featured_btn_text", "ดูเมนูอร่อยทั้งหมดเพิ่มเติม →", "ดูเมนูแนะนำทั้งหมด →"],
  ["seasonal_btn_text", "ดูเมนูพิเศษตามฤดูกาลเพิ่มเติม →", "ดูเมนูตามฤดูกาลทั้งหมด →"],
  ["contact_btn_text", "เปิด Google Maps นำทางมาร้าน", "เปิดเส้นทางใน Google Maps"],
  ["about_title", "บ้านหลังนี้เป็นบ้านจริงๆ ของครอบครัวเรา", "บ้านหลังนี้คือบ้านของครอบครัวเราจริง ๆ"],
] as const;

export async function getDb(): Promise<Database> {
  if (globalDb) {
    return globalDb;
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Initialize tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      category TEXT NOT NULL,
      available INTEGER DEFAULT 1,
      is_recommended INTEGER DEFAULT 0,
      is_seasonal INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run dynamic migrations to add new columns if they do not exist
  try {
    await db.exec("ALTER TABLE menus ADD COLUMN is_recommended INTEGER DEFAULT 0");
  } catch {}
  try {
    await db.exec("ALTER TABLE menus ADD COLUMN is_seasonal INTEGER DEFAULT 0");
  } catch {}
  try {
    await db.exec("ALTER TABLE menus ADD COLUMN is_visible INTEGER DEFAULT 1");
  } catch {}
  try {
    await db.exec("ALTER TABLE menus ADD COLUMN sort_order INTEGER DEFAULT 0");
  } catch {}

  // Keep existing custom copy intact and update only untouched legacy defaults.
  for (const [key, legacyValue, updatedValue] of LEGACY_COPY_UPDATES) {
    await db.run(
      "UPDATE settings SET value = ? WHERE key = ? AND value = ?",
      [updatedValue, key, legacyValue],
    );
  }

  globalDb = db;
  return db;
}
