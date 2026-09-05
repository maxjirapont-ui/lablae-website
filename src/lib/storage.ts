import fs from "node:fs";
import path from "node:path";

function resolveConfiguredPath(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? path.resolve(/*turbopackIgnore: true*/ trimmed) : null;
}

export function getDataDirectory(): string {
  return (
    resolveConfiguredPath(process.env.DATA_DIR) ||
    resolveConfiguredPath(process.env.RAILWAY_VOLUME_MOUNT_PATH) ||
    path.join(/*turbopackIgnore: true*/ process.cwd(), ".data")
  );
}

export function getDatabasePath(): string {
  return (
    resolveConfiguredPath(process.env.DATABASE_PATH) ||
    path.join(getDataDirectory(), "restaurant.db")
  );
}

export function getUploadsDirectory(): string {
  return (
    resolveConfiguredPath(process.env.UPLOAD_DIR) ||
    path.join(getDataDirectory(), "uploads")
  );
}

export function getLegacyDatabasePath(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "database", "restaurant.db");
}

export function getSeedDatabasePath(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "database", "seed.db");
}

export function getLegacyUploadsDirectory(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
}

export function ensureRuntimeStorage(): void {
  const databasePath = getDatabasePath();
  fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(databasePath), {
    recursive: true,
  });
  fs.mkdirSync(/*turbopackIgnore: true*/ getUploadsDirectory(), {
    recursive: true,
  });

  if (fs.existsSync(/*turbopackIgnore: true*/ databasePath)) return;

  const source = [getLegacyDatabasePath(), getSeedDatabasePath()].find((candidate) =>
    fs.existsSync(/*turbopackIgnore: true*/ candidate),
  );
  if (
    source &&
    path.resolve(/*turbopackIgnore: true*/ source) !==
      path.resolve(/*turbopackIgnore: true*/ databasePath)
  ) {
    fs.copyFileSync(
      /*turbopackIgnore: true*/ source,
      /*turbopackIgnore: true*/ databasePath,
    );
  }
}

export function hasPersistentStorage(): boolean {
  return Boolean(
    process.env.DATA_DIR?.trim() ||
      process.env.DATABASE_PATH?.trim() ||
      process.env.UPLOAD_DIR?.trim() ||
      process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim(),
  );
}
