import { getDb } from "./db";

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  available: number;
  is_recommended?: number;
  is_seasonal?: number;
  is_visible?: number;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  created_at: string;
  part_number?: number;
  part_title?: string;
  chapter_number?: number;
  excerpt?: string;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const db = await getDb();
  return db.all<MenuItem[]>("SELECT * FROM menus WHERE is_visible = 1 ORDER BY category, name");
}

export async function getArticles(): Promise<Article[]> {
  const db = await getDb();
  return db.all<Article[]>("SELECT * FROM articles ORDER BY part_number ASC, chapter_number ASC, id ASC");
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const db = await getDb();
  return db.get<Article>("SELECT * FROM articles WHERE slug = ?", [slug]);
}

export async function getSetting(key: string): Promise<string> {
  const db = await getDb();
  const row = await db.get<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : "";
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
}
