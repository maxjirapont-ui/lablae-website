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

const HOUSE_COPY_REPLACEMENTS = [
  ["เรือนไม้สักโบราณไร้ตะปู 100 ปี", "บ้านไม้ 100 ปีไร้ตะปู"],
  ["ใต้ถุนเรือนไม้สักทอง 100 ปี", "ใต้ถุนบ้านไม้ 100 ปี"],
  ["ใต้ถุนเรือนไม้สักโบราณไร้ตะปู อายุกว่า 100 ปี", "ใต้ถุนบ้านไม้ 100 ปีไร้ตะปู"],
  ["เรือนไม้โบราณ 100+ ปี (เรือนหม่อนน้อย)", "บ้านไม้ 100 ปี (เรือนหม่อนน้อย)"],
] as const;

const HOMEMADE_CURRY_PASTE_COPY_REPLACEMENTS = [
  ["ตำมือ 100% – พริกแกงสดจากป้า ๆ ในครัวลับแล", "พริกแกงทำเองโดยป้า ๆ ในครัวลับแล"],
  ["ครัวสดมือ 100%", "รสมือครอบครัว"],
  ["ตำมือ 100%", "พริกแกงทำเอง"],
  ["พริกแกงสดไม่สำเร็จรูป", "โดยป้า ๆ ในครัว"],
  ["พริกแกงโขลกสดด้วยครกหินทุกเช้า", "ป้า ๆ ทำเองตามสูตรของครอบครัวทุกวัน"],
  ["พริกแกงป้าชุมกับป้าชิดยังทำเองทุกวัน เสียงสากกระทบครกหินคือสัญญาณว่าครัวบ้านเราเปิดแล้ว", "พริกแกงป้าชุมกับป้าชิดทำเองทุกวัน เป็นรสมือที่ครอบครัวเราดูแลกันมาตลอด"],
  ["หัวใจที่ทำให้อาหารร้านลำลำลับแลมีรสชาติเฉพาะตัว คือ 'เครื่องในครก' ที่ไม่มีทางหาได้จากพริกแกงสำเร็จรูปในท้องตลาด", "หัวใจที่ทำให้อาหารร้านลำลำลับแลมีรสชาติเฉพาะตัว คือพริกแกงสูตรของบ้านที่ป้า ๆ ทำเอง ไม่ใช้พริกแกงสำเร็จรูปจากท้องตลาด"],
  ["จากนั้นจะช่วยกันโขลกในครกหินด้วยมือจนเนื้อเนียนละเอียด น้ำมันหอมระเหยจากสมุนไพรสดจึงแตกตัวออกมาเต็มที่ ให้รสชาติเผ็ดลึก หอมละมุน กลมกล่อม และมีมิติที่พริกแกงเครื่องปั่นไม่สามารถทำได้", "จากนั้นป้า ๆ จะนำวัตถุดิบมาทำเป็นพริกแกงตามสูตรของครอบครัว เพื่อให้ได้รสเผ็ดลึก หอมละมุน กลมกล่อม และคงรสมือของบ้านเราไว้ในทุกจาน"],
  ["จานเด็ดที่กำเนิดจากพริกแกงตำมือนี้", "จานเด็ดที่ใช้พริกแกงทำเองของบ้าน"],
  ["พริกข่าตำมือหอมกรุ่น", "พริกข่าสูตรทำเองของบ้าน"],
  ["พริกหนุ่มเผาเตาถ่านตำสดคู่", "พริกหนุ่มเผาเตาถ่าน ปรุงสดคู่"],
  ["ตำสดทุกวัน", "ทำสดทุกวัน"],
  ["โขลกครกหินสดใหม่ทุกเช้า", "พริกแกงทำเองโดยป้า ๆ"],
  ["น้ำมันหอมระเหยจากสมุนไพรแตกตัว กลิ่นหอมฟุ้งยาวนาน", "คัดและเตรียมสมุนไพรตามสูตรของครอบครัว เพื่อรสชาติที่เป็นเอกลักษณ์"],
  ["พริกแกงทุกครกตาเงินยายจันโขลกเอง", "พริกแกงตาเงินยายจันทำเองตามสูตรของครอบครัว"],
  ["พริกแกงทุกครกโขลกเองด้วยมือ", "พริกแกงทำเองตามสูตรของครอบครัว"],
  ["ระหว่างโขลกพริกแกง", "ระหว่างเตรียมพริกแกง"],
  ["พริกแกงตำมือ", "พริกแกงทำเอง"],
  ["พริกแกงโขลกมือ", "พริกแกงทำเอง"],
  ["พริกแกงโขลกเอง", "พริกแกงทำเอง"],
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

    CREATE TABLE IF NOT EXISTS booking_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      reason TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, time)
    );

    CREATE TABLE IF NOT EXISTS line_webhook_events (
      event_id TEXT PRIMARY KEY,
      processed_at TEXT DEFAULT CURRENT_TIMESTAMP
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
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN booking_code TEXT");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN notes TEXT DEFAULT ''");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN tables_required INTEGER DEFAULT 1");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN duration_minutes INTEGER DEFAULT 60");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN source TEXT DEFAULT 'web'");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN customer_line_user_id TEXT");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN line_delivery_status TEXT DEFAULT 'not_configured'");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN status_updated_at TEXT");
  } catch {}
  try {
    await db.exec("ALTER TABLE reservations ADD COLUMN status_updated_by TEXT DEFAULT ''");
  } catch {}
  try {
    await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_booking_code ON reservations(booking_code) WHERE booking_code IS NOT NULL");
    await db.exec("CREATE INDEX IF NOT EXISTS idx_reservations_date_status ON reservations(date, status)");
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

  const houseCopyMigrationName = "rename_teak_house_to_100_year_house_2026_09_06";
  const houseCopyMigration = await db.get<{ name: string }>(
    "SELECT name FROM app_migrations WHERE name = ?",
    [houseCopyMigrationName],
  );
  if (!houseCopyMigration) {
    for (const [legacyValue, updatedValue] of HOUSE_COPY_REPLACEMENTS) {
      await db.run(
        "UPDATE settings SET value = REPLACE(value, ?, ?) WHERE INSTR(value, ?) > 0",
        [legacyValue, updatedValue, legacyValue],
      );
    }

    // The four-story editor stores its copy as JSON. Remove the old teak framing
    // there too while preserving the rest of the owner-approved story text.
    await db.run(
      "UPDATE settings SET value = REPLACE(REPLACE(value, ?, ?), ?, ?) WHERE key = ?",
      ["ไม้สักทอง", "ไม้", "ไม้สัก", "ไม้", "custom_stories_data"],
    );

    await db.run("INSERT INTO app_migrations (name) VALUES (?)", [houseCopyMigrationName]);
  }

  const houseLabelMigrationName = "normalize_100_year_house_labels_2026_09_06";
  const houseLabelMigration = await db.get<{ name: string }>(
    "SELECT name FROM app_migrations WHERE name = ?",
    [houseLabelMigrationName],
  );
  if (!houseLabelMigration) {
    const labelReplacements = [
      ["ไม้โบราณไร้ตะปู 100 ปี", "บ้านไม้ 100 ปีไร้ตะปู"],
      ["ใต้ถุนเรือนไม้ 100 ปี", "ใต้ถุนบ้านไม้ 100 ปี"],
    ] as const;
    for (const [legacyValue, updatedValue] of labelReplacements) {
      await db.run(
        "UPDATE settings SET value = REPLACE(value, ?, ?) WHERE INSTR(value, ?) > 0",
        [legacyValue, updatedValue, legacyValue],
      );
    }
    await db.run(
      "UPDATE settings SET value = REPLACE(REPLACE(value, ?, ?), ?, ?) WHERE key = ?",
      ["\"statLabel\":\"อายุเรือนไม้\"", "\"statLabel\":\"อายุบ้านไม้\"", "เรือนไม้สองชั้นหลังนี้", "บ้านไม้สองชั้นหลังนี้", "custom_stories_data"],
    );
    await db.run("INSERT INTO app_migrations (name) VALUES (?)", [houseLabelMigrationName]);
  }

  const homemadeCurryPasteMigrationName = "accurate_homemade_curry_paste_copy_2026_09_06";
  const homemadeCurryPasteMigration = await db.get<{ name: string }>(
    "SELECT name FROM app_migrations WHERE name = ?",
    [homemadeCurryPasteMigrationName],
  );
  if (!homemadeCurryPasteMigration) {
    for (const [legacyValue, updatedValue] of HOMEMADE_CURRY_PASTE_COPY_REPLACEMENTS) {
      await db.run(
        "UPDATE settings SET value = REPLACE(value, ?, ?) WHERE INSTR(value, ?) > 0",
        [legacyValue, updatedValue, legacyValue],
      );
    }
    await db.run("INSERT INTO app_migrations (name) VALUES (?)", [homemadeCurryPasteMigrationName]);
  }

  const kitchenStoryCopyMigrationName = "normalize_homemade_curry_paste_story_v2_2026_09_06";
  const kitchenStoryCopyMigration = await db.get<{ name: string }>(
    "SELECT name FROM app_migrations WHERE name = ?",
    [kitchenStoryCopyMigrationName],
  );
  if (!kitchenStoryCopyMigration) {
    const customStoriesRow = await db.get<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      ["custom_stories_data"],
    );

    if (customStoriesRow?.value) {
      try {
        const customStories = JSON.parse(customStoriesRow.value) as Record<string, unknown>;
        const currentKitchen =
          customStories.kitchen &&
          typeof customStories.kitchen === "object" &&
          !Array.isArray(customStories.kitchen)
            ? (customStories.kitchen as Record<string, unknown>)
            : {};

        customStories.kitchen = {
          ...currentKitchen,
          badge: "รสมือครอบครัว",
          stat: "พริกแกงทำเอง",
          statLabel: "โดยป้า ๆ ในครัว",
          title: "พริกแกงทำเองโดยป้า ๆ ในครัวลับแล",
          subtitle: "ไม่ใช้พริกแกงสำเร็จรูป ป้า ๆ ทำเองตามสูตรของครอบครัวทุกวัน",
          quote: "“พริกแกงป้าชุมกับป้าชิดทำเองทุกวัน เป็นรสมือที่ครอบครัวเราดูแลกันมาตลอด”",
          quoteAuthor: "ครัวบ้าน 100 ปี",
          paragraphs: [
            "หัวใจที่ทำให้อาหารร้านลำลำลับแลมีรสชาติเฉพาะตัว คือพริกแกงสูตรของบ้านที่ป้า ๆ ทำเอง ไม่ใช้พริกแกงสำเร็จรูปจากท้องตลาด",
            "ทุกเช้าตรู่ในครัว ป้าชุม ป้าชิด และแม่ครัวประจำบ้าน 100 ปี จะเริ่มวันด้วยการเด็ดพริกแห้ง ปอกกระเทียมไทยพันธุ์ลับแล หั่นข่า ตะไคร้ ขมิ้นชัน และคั่วมะแขว่นจนกลิ่นหอมฟุ้งลอยไปทั่วใต้ถุนบ้าน",
            "จากนั้นป้า ๆ จะนำวัตถุดิบมาทำเป็นพริกแกงตามสูตรของครอบครัว เพื่อให้ได้รสเผ็ดลึก หอมละมุน กลมกล่อม และคงรสมือของบ้านเราไว้ในทุกจาน",
            "จานเด็ดที่ใช้พริกแกงทำเองของบ้าน ได้แก่ 'หมูทอดลับแลพริกข่า' สามชั้นทอดคลุกพริกข่าคั่วหอม, 'แกงอ่อมหมู/ไก่' ตุ๋นเตาถ่านข้ามวันจนนุ่มละลายในปาก, 'น้ำพริกหนุ่ม-น้ำพริกอ่อง' ทำสดใหม่ทุกวัน และ 'ชุดขันโตกบ้าน 100 ปี' สำรับรวมรอยต่อวัฒนธรรมล้านนา-สุโขทัย",
          ],
        };

        await db.run("UPDATE settings SET value = ? WHERE key = ?", [
          JSON.stringify(customStories),
          "custom_stories_data",
        ]);
      } catch {
        // Keep the existing value intact if an owner-entered JSON value is malformed.
      }
    }

    await db.run("INSERT INTO app_migrations (name) VALUES (?)", [kitchenStoryCopyMigrationName]);
  }

  globalDb = db;
  return db;
}
