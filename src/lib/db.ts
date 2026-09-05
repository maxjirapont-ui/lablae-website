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

const LEGACY_MENU_NAME_UPDATES = [
  ["น้ำปลาร้า(ขวด)", "น้ำปลาร้า (ขวด)"],
  ["สตอบอรี่โซดา", "สตรอว์เบอร์รีโซดา"],
] as const;

const LEGACY_MENU_TEXT_REPLACEMENTS = [
  ["หอมๆ", "หอม ๆ"],
  ["อ่อนๆ", "อ่อน ๆ"],
  ["เสมอๆ", "เสมอ ๆ"],
  ["นัวๆ", "นัว ๆ"],
  ["แน่นๆ", "แน่น ๆ"],
  ["ร้อนๆ", "ร้อน ๆ"],
  ["เยิ้มๆ", "เยิ้ม ๆ"],
  ["แท้ๆ", "แท้ ๆ"],
  ["หมูทอดลับแลแบบจัดเต็ม 2 เสิร์ฟของสามชั้นทอด", "หมูสามชั้นทอด 2 เสิร์ฟ"],
  ["ปูเลี้ยงออแกนิค", "ปูเลี้ยงแบบออร์แกนิก"],
  ["แกงฮังเลหมูสามชั้น ที่เคี่ยว", "แกงฮังเลหมูสามชั้นที่เคี่ยว"],
  ["ละลายในปากรสชาติ", "ละลายในปาก รสชาติ"],
  ["ตำส้มตำกุ้งสดเนื้อเด้งฉ่ำ", "ส้มตำกุ้งสดเนื้อเด้งฉ่ำ"],
] as const;

const LEGACY_CATEGORY_UPDATES = [
  ["เซทขันโตก", "เซตขันโตก"],
  ["เครื่องดื่มดับแซ่บ & น้ำสมุนไพร", "เครื่องดื่มและน้ำสมุนไพร"],
  ["ของหวาน & ทานเล่น", "ของหวานและของกินเล่น"],
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

    CREATE TABLE IF NOT EXISTS app_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
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

  const copyMigrationName = "polish_thai_copy_2026_09_06";
  const copyMigration = await db.get<{ name: string }>(
    "SELECT name FROM app_migrations WHERE name = ?",
    [copyMigrationName],
  );

  if (!copyMigration) {
    // Keep custom content intact by changing only known legacy values and phrases.
    for (const [key, legacyValue, updatedValue] of LEGACY_COPY_UPDATES) {
      await db.run(
        "UPDATE settings SET value = ? WHERE key = ? AND value = ?",
        [updatedValue, key, legacyValue],
      );
    }

    for (const [legacyValue, updatedValue] of LEGACY_MENU_NAME_UPDATES) {
      await db.run("UPDATE menus SET name = ? WHERE name = ?", [updatedValue, legacyValue]);
    }

    for (const [legacyValue, updatedValue] of LEGACY_MENU_TEXT_REPLACEMENTS) {
      await db.run(
        "UPDATE menus SET description = REPLACE(description, ?, ?) WHERE INSTR(description, ?) > 0",
        [legacyValue, updatedValue, legacyValue],
      );
    }

    for (const [legacyValue, updatedValue] of LEGACY_CATEGORY_UPDATES) {
      await db.run("UPDATE menus SET category = ? WHERE category = ?", [updatedValue, legacyValue]);
      await db.run(
        "UPDATE settings SET value = REPLACE(value, ?, ?) WHERE key = ? AND INSTR(value, ?) > 0",
        [legacyValue, updatedValue, "menu_categories_order", legacyValue],
      );
    }

    await db.run("INSERT INTO app_migrations (name) VALUES (?)", [copyMigrationName]);
  }

  globalDb = db;
  return db;
}
