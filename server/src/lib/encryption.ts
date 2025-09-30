// encryption.ts
// Node.js compatible cookie-signing helper functions using node:crypto
// Adapted from cookie-helpers.ts for server-side Node environment

import crypto from 'node:crypto';
export type Payload = { id: string; exp: number; };

let keyBuffer: Buffer | null = null;

function getEncryptionKey(): string {
  const KEY = process.env.ENCRYPTION_KEY_BASED;
  if (!KEY) {
    throw new Error("Missing ENCRYPTION_KEY env var");
  }
  return KEY;
}

function getKeyBuffer(): Buffer {
  if (!keyBuffer) {
    const KEY = getEncryptionKey();
    keyBuffer = Buffer.from(KEY, 'base64');
  }
  return keyBuffer;
}

/**
 * Encrypts a small JSON payload and returns a compact base64 string.
 */
export async function encryptPayload(payload: Payload): Promise<string> {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');

  let encrypted = cipher.update(plaintext);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  const ivB64 = iv.toString('base64');
  const ctB64 = encrypted.toString('base64');
  const tagB64 = authTag.toString('base64');

  return `${ivB64}.${ctB64}.${tagB64}`;
}

/**
 * Decrypts the compact string and returns the object or throws on failure.
 */
export async function decryptPayload(token: string): Promise<Payload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const iv = Buffer.from(parts[0], 'base64');
  const ciphertext = Buffer.from(parts[1], 'base64');
  const tag = Buffer.from(parts[2], 'base64');

  const key = getKeyBuffer();

  const decipher = crypto.createDecipheriv('aes-128-gcm', key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  const plaintext = decrypted.toString('utf8');
  return JSON.parse(plaintext);
}
