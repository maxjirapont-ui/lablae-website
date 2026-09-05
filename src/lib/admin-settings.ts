import { setAdminPassword } from "./admin-auth";
import { getDb } from "./db";
import { toArabicDigits } from "./text";

const CLIENT_BLOCKED_KEYS = new Set([
  "admin_password_hash",
  "admin_password_configured",
  "line_notify_token_configured",
  "line_messaging_configured",
  "line_group_connected",
  "line_group_id",
  "last_published_at",
]);

const DIGIT_NORMALIZATION_EXCLUDED_KEYS = new Set([
  "admin_password",
  "line_notify_token",
  "announcement_link",
  "brand_logo",
  "facebook_url",
  "google_maps_url",
  "google_reviews_url",
  "hero_btn1_link",
  "hero_btn2_link",
  "home_about_image",
  "home_hero_image",
  "tiktok_url",
  "youtube_url",
]);

export async function saveAdminSettings(
  settings: Record<string, unknown>,
): Promise<{ passwordChanged: boolean }> {
  const db = await getDb();
  let passwordChanged = false;

  for (const [key, value] of Object.entries(settings)) {
    if (CLIENT_BLOCKED_KEYS.has(key)) continue;

    if (key === "admin_password") {
      if (typeof value === "string" && value.trim()) {
        await setAdminPassword(value);
        passwordChanged = true;
      }
      continue;
    }

    // Legacy LINE Notify values are kept out of new settings writes.
    if (key === "line_notify_token") continue;

    const rawStringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
    const stringValue = DIGIT_NORMALIZATION_EXCLUDED_KEYS.has(key)
      ? rawStringValue
      : toArabicDigits(rawStringValue);
    await db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, stringValue],
    );
  }

  return { passwordChanged };
}

export function redactSettings(
  rows: Array<{ key: string; value: string }>,
): Record<string, string> {
  const settings: Record<string, string> = {};
  for (const row of rows) {
    if (row.key === "admin_password" || row.key === "admin_password_hash") {
      settings.admin_password_configured = "1";
      continue;
    }
    if (row.key === "line_notify_token") {
      settings.line_notify_token_configured = row.value ? "1" : "0";
      continue;
    }
    settings[row.key] = row.value;
  }
  return settings;
}
