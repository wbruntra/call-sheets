// AES-GCM-256 + PBKDF2 encryption/decryption
// Works in both browsers (Web Crypto API) and Bun

function b64enc(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  // chunk to avoid stack overflow on large buffers
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

function b64dec(s) {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt a JSON-serialisable object with a password. Returns a compact JSON string. */
export async function encryptData(password, obj) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const enc  = new TextEncoder();
  const ct   = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(obj))
  );
  return JSON.stringify({ salt: b64enc(salt), iv: b64enc(iv), ct: b64enc(ct) });
}

/**
 * Decrypt a payload produced by encryptData.
 * Returns the parsed object on success, throws on wrong password or tampered data.
 */
export async function decryptData(password, payload) {
  const { salt, iv, ct } = JSON.parse(payload);
  const key = await deriveKey(password, b64dec(salt));
  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64dec(iv) },
    key,
    b64dec(ct)
  );
  return JSON.parse(new TextDecoder().decode(dec));
}
