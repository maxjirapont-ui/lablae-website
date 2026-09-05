import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { ensureRuntimeStorage, getDatabasePath } from './storage';
import { toArabicDigits } from './text';

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

const ARABIC_DIGIT_SETTING_KEYS = [
  "about_badge",
  "about_page_custom_data",
  "about_quote",
  "about_quote_author",
  "about_story_text",
  "about_title",
  "address",
  "announcement_badge",
  "announcement_link_text",
  "announcement_text",
  "custom_stories_data",
  "gallery_badge",
  "gallery_subtitle",
  "gallery_title",
  "hero_badge",
  "hero_btn1_text",
  "hero_btn2_text",
  "hero_description",
  "hero_subtitle",
  "hero_title",
  "home_about_image_caption",
  "home_book_description",
  "hours",
  "menu_page_badge",
  "phone",
  "restaurant_desc",
  "restaurant_gallery",
  "restaurant_name",
] as const;

async function migrateContentDigitsToArabic(db: Database): Promise<void> {
  const settingPlaceholders = ARABIC_DIGIT_SETTING_KEYS.map(() => "?").join(", ");
  const settingRows = await db.all<Array<{ key: string; value: string }>>(
    `SELECT key, value FROM settings WHERE key IN (${settingPlaceholders})`,
    [...ARABIC_DIGIT_SETTING_KEYS],
  );

  for (const row of settingRows) {
    const normalizedValue = toArabicDigits(row.value);
    if (normalizedValue !== row.value) {
      await db.run("UPDATE settings SET value = ? WHERE key = ?", [normalizedValue, row.key]);
    }
  }

  const menuRows = await db.all<Array<{
    id: number;
    name: string;
    description: string | null;
    category: string;
  }>>("SELECT id, name, description, category FROM menus");
  for (const row of menuRows) {
    await db.run(
      "UPDATE menus SET name = ?, description = ?, category = ? WHERE id = ?",
      [
        toArabicDigits(row.name),
        toArabicDigits(row.description || ""),
        toArabicDigits(row.category),
        row.id,
      ],
    );
  }

  const articleRows = await db.all<Array<{
    id: number;
    title: string;
    content: string;
    part_title: string | null;
    excerpt: string | null;
  }>>("SELECT id, title, content, part_title, excerpt FROM articles");
  for (const row of articleRows) {
    await db.run(
      "UPDATE articles SET title = ?, content = ?, part_title = ?, excerpt = ? WHERE id = ?",
      [
        toArabicDigits(row.title),
        toArabicDigits(row.content),
        toArabicDigits(row.part_title || ""),
        toArabicDigits(row.excerpt || ""),
        row.id,
      ],
    );
  }
}

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
  try {
    await db.exec("ALTER TABLE articles ADD COLUMN part_number INTEGER DEFAULT 0");
  } catch {}
  try {
    await db.exec("ALTER TABLE articles ADD COLUMN part_title TEXT DEFAULT ''");
  } catch {}
  try {
    await db.exec("ALTER TABLE articles ADD COLUMN chapter_number INTEGER DEFAULT 0");
  } catch {}
  try {
    await db.exec("ALTER TABLE articles ADD COLUMN excerpt TEXT DEFAULT ''");
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

  const arabicDigitMigrationName = "customer_facing_arabic_digits_2026_09_06";
  const arabicDigitMigration = await db.get<{ name: string }>(
    "SELECT name FROM app_migrations WHERE name = ?",
    [arabicDigitMigrationName],
  );
  if (!arabicDigitMigration) {
    await migrateContentDigitsToArabic(db);
    await db.run("INSERT INTO app_migrations (name) VALUES (?)", [arabicDigitMigrationName]);
  }

  globalDb = db;
  return db;
}
