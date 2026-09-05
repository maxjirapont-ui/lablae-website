import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const PASSWORD_HASH_KEY = "admin_password_hash";
const LEGACY_PASSWORD_KEY = "admin_password";
const SCRYPT_KEY_LENGTH = 64;

type SessionPayload = {
  exp: number;
  iat: number;
  nonce: string;
};

function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await derivePasswordKey(password, salt);
  return `scrypt$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyPasswordHash(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  const [algorithm, saltValue, hashValue] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;

  try {
    const expected = Buffer.from(hashValue, "base64url");
    const actual = await derivePasswordKey(
      password,
      Buffer.from(saltValue, "base64url"),
    );
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

async function getStoredPasswordHash(): Promise<string> {
  const db = await getDb();
  const row = await db.get<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [PASSWORD_HASH_KEY],
  );
  return row?.value || process.env.ADMIN_PASSWORD_HASH?.trim() || "";
}

export async function setAdminPassword(password: string): Promise<void> {
  if (password.length < 12) {
    throw new Error("รหัสผ่านใหม่ต้องมีอย่างน้อย 12 ตัวอักษร");
  }
  if (password.length > 256) {
    throw new Error("รหัสผ่านใหม่ยาวเกินไป");
  }

  const db = await getDb();
  const encodedHash = await hashAdminPassword(password);
  await db.run(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [PASSWORD_HASH_KEY, encodedHash],
  );
  await db.run("DELETE FROM settings WHERE key = ?", [LEGACY_PASSWORD_KEY]);
}

export async function authenticateAdminPassword(password: string): Promise<{
  valid: boolean;
  configured: boolean;
}> {
  if (!password || password.length > 256) {
    return { valid: false, configured: true };
  }

  const storedHash = await getStoredPasswordHash();
  if (storedHash) {
    return {
      valid: await verifyPasswordHash(password, storedHash),
      configured: true,
    };
  }

  const db = await getDb();
  const legacyRow = await db.get<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [LEGACY_PASSWORD_KEY],
  );
  const legacyPassword = legacyRow?.value || process.env.ADMIN_PASSWORD?.trim() || "";
  if (!legacyPassword) return { valid: false, configured: false };

  const valid = safeStringEqual(password, legacyPassword);
  if (valid) {
    // One successful login transparently removes the remaining plaintext credential.
    await setAdminPassword(password);
  }
  return { valid, configured: true };
}

async function getSessionSigningKey(): Promise<Buffer | null> {
  const explicitSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicitSecret) return Buffer.from(explicitSecret);

  const passwordHash = await getStoredPasswordHash();
  if (passwordHash) return Buffer.from(passwordHash);

  const fallbackPassword = process.env.ADMIN_PASSWORD?.trim();
  return fallbackPassword ? Buffer.from(fallbackPassword) : null;
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function createAdminSession(): Promise<string> {
  const signingKey = await getSessionSigningKey();
  if (!signingKey) throw new Error("ยังไม่ได้ตั้งค่ารหัสผ่านผู้ดูแลระบบ");

  const now = Math.floor(Date.now() / 1000);
  const encodedPayload = encodePayload({
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE,
    nonce: randomBytes(16).toString("base64url"),
  });
  const signature = createHmac("sha256", signingKey)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [encodedPayload, suppliedSignature] = token.split(".");
  if (!encodedPayload || !suppliedSignature) return false;

  const signingKey = await getSessionSigningKey();
  if (!signingKey) return false;
  const expectedSignature = createHmac("sha256", signingKey)
    .update(encodedPayload)
    .digest("base64url");
  if (!safeStringEqual(suppliedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    return (
      typeof payload.iat === "number" &&
      typeof payload.exp === "number" &&
      typeof payload.nonce === "string" &&
      payload.iat <= now + 60 &&
      payload.exp > now
    );
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export function adminCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict" as const,
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
    priority: "high" as const,
  };
}
