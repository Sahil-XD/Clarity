/**
 * Clarity Private Vault — AES-256-GCM End-to-End Encryption
 * Uses Web Crypto API (supported natively in all modern browsers & Tauri WebView2).
 */

const ENC_PREFIX = "clarity_enc:v1:";

/**
 * Derives a 256-bit AES-GCM CryptoKey from a 4-digit PIN and user-specific salt using PBKDF2 (100k iterations).
 */
async function deriveVaultKey(pin: string, userId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin.trim()),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`clarity-vault-salt:${userId}`),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Output format: clarity_enc:v1:<iv_b64>:<ciphertext_b64>
 */
export async function encryptVaultText(plainText: string, pin: string, userId: string): Promise<string> {
  if (!plainText) return "";
  const key = await deriveVaultKey(pin, userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const encryptedBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );

  // Convert bytes to base64
  let binaryIv = "";
  for (let i = 0; i < iv.byteLength; i++) {
    binaryIv += String.fromCharCode(iv[i]);
  }
  const ivB64 = btoa(binaryIv);

  const cipherBytes = new Uint8Array(encryptedBuf);
  let binaryCipher = "";
  for (let i = 0; i < cipherBytes.byteLength; i++) {
    binaryCipher += String.fromCharCode(cipherBytes[i]);
  }
  const cipherB64 = btoa(binaryCipher);

  return `${ENC_PREFIX}${ivB64}:${cipherB64}`;
}

/**
 * Decrypts a vault ciphertext string.
 * Supports transparent backward-compatibility: if the input does NOT start with `clarity_enc:v1:`,
 * it treats it as legacy plaintext and returns it as-is.
 */
export async function decryptVaultText(cipherText: string, pin: string, userId: string): Promise<string> {
  if (!cipherText) return "";
  if (!cipherText.startsWith(ENC_PREFIX)) {
    // Legacy plaintext entry — return as is
    return cipherText;
  }

  const payload = cipherText.slice(ENC_PREFIX.length);
  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) return cipherText;

  const ivB64 = payload.slice(0, colonIdx);
  const cipherB64 = payload.slice(colonIdx + 1);

  try {
    const key = await deriveVaultKey(pin, userId);
    const binaryIv = atob(ivB64);
    const iv = new Uint8Array(binaryIv.length);
    for (let i = 0; i < binaryIv.length; i++) {
      iv[i] = binaryIv.charCodeAt(i);
    }

    const binaryCipher = atob(cipherB64);
    const cipherBytes = new Uint8Array(binaryCipher.length);
    for (let i = 0; i < binaryCipher.length; i++) {
      cipherBytes[i] = binaryCipher.charCodeAt(i);
    }

    const decryptedBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes
    );

    return new TextDecoder().decode(decryptedBuf);
  } catch (err) {
    console.error("Failed to decrypt vault entry with provided PIN:", err);
    throw new Error("Failed to decrypt diary entry. Invalid PIN or corrupted data.");
  }
}
