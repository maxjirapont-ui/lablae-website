import { setAdminPassword } from "./admin-auth";
import { getDb } from "./db";

const CLIENT_BLOCKED_KEYS = new Set([
  "admin_password_hash",
  "admin_password_configured",
  "line_notify_token_configured",
  "last_published_at",
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

    // A blank field means "keep the existing token"; the stored token is never sent to the browser.
    if (key === "line_notify_token" && !String(value ?? "").trim()) continue;

    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
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
