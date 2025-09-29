// cookie-helpers.ts
// A set of cookie-signing helper functions
// Rewritten to use Web Crypto API for Next.js Edge runtime compatibility
import type { Payload } from "./types";

const IV_BYTES = 12;

let cryptoKeyPromise: Promise<CryptoKey> | null = null;

function getEncryptionKey(): string {
  const KEY = process.env.ENCRYPTION_KEY;
  if (!KEY) {
    throw new Error("Missing ENCRYPTION_KEY env var");
  }
  return KEY;
}

async function getCryptoKey(): Promise<CryptoKey> {
  if (!cryptoKeyPromise) {
    const KEY = getEncryptionKey();
    const keyData = Uint8Array.from(atob(KEY), (c) => c.charCodeAt(0));

    cryptoKeyPromise = crypto.subtle.importKey(
      "raw",
      keyData,
      { name: 'AES-GCM' },
      false,
      ["encrypt", "decrypt"]
    );
  }
  return cryptoKeyPromise;
}

/**
 * Encrypts a small JSON payload and returns a compact base64 string.
 */
export async function encryptPayload(payload: Payload): Promise<string> {
  const key = await getCryptoKey();
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);

  const plaintext = new TextEncoder().encode(JSON.stringify(payload));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  const encryptedUint8 = new Uint8Array(encrypted);
  const ciphertext = encryptedUint8.slice(0, -16);
  const tag = encryptedUint8.slice(-16);

  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...ciphertext));
  const tagB64 = btoa(String.fromCharCode(...tag));

  return `${ivB64}.${ctB64}.${tagB64}`;
}

/**
 * Decrypts the compact string and returns the object or throws on failure.
 */
export async function decryptPayload(token: string): Promise<Payload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const iv = Uint8Array.from(atob(parts[0]), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));

  const key = await getCryptoKey();

  const data = new Uint8Array(ciphertext.length + tag.length);
  data.set(ciphertext, 0);
  data.set(tag, data.length - 16);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  const plaintext = new TextDecoder().decode(decrypted);
  return JSON.parse(plaintext);
}
