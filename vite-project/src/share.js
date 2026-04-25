import LZString from 'lz-string';
import { uid } from './utils';
import { encryptData, decryptData } from './crypto.js';

export const VERSION = 1;

export function compressDayToURL(day) {
  const portable = makePortable(day);
  const json = JSON.stringify(portable);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return compressed;
}

export function decompressDayFromURL(compressed) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const portable = JSON.parse(json);
    return hydratePortable(portable);
  } catch (e) {
    console.warn('Failed to decompress shared data:', e);
    return null;
  }
}

function makePortable(day) {
  const logos = (day.logos || []).map(l => {
    const out = { label: l.label };
    if (l.dataUrl && !l.dataUrl.startsWith('data:')) {
      out.url = l.dataUrl;
    }
    return out;
  });
  return {
    $version: VERSION,
    meta: day.meta,
    logos,
    sections: day.sections.map(s => ({
      type: s.type,
      title: s.title,
      data: s.data,
    })),
    pageBreaks: day.pageBreaks || [],
  };
}

function hydratePortable(p) {
  if (!p || !p.meta) return null;
  const version = p.$version || 0;
  if (version > VERSION) {
    console.warn(`Shared data version ${version} is newer than app version ${VERSION}`);
  }
  if (version < VERSION) {
    p = migratePortable(p, version);
  }
  const logos = (p.logos || []).map(l => ({
    label: l.label || '',
    dataUrl: l.url || l.dataUrl || '',
  }));
  return {
    id: uid(),
    meta: p.meta,
    logos,
    pageBreaks: p.pageBreaks || [],
    sections: (p.sections || []).map(s => ({ ...s, id: uid() })),
  };
}

function migratePortable(p, fromVersion) {
  return p;
}

export function dayToJSON(day) {
  const portable = makePortable(day);
  return JSON.stringify(portable, null, 2);
}

export function dayFromJSON(text) {
  try {
    const p = JSON.parse(text);
    return hydratePortable(p);
  } catch (e) {
    return null;
  }
}

export function storeToJSON(store) {
  const portable = {
    $version: VERSION,
    days: store.days.map(day => makePortable(day)),
    currentDayId: store.currentDayId,
    tweaks: store.tweaks,
  };
  return JSON.stringify(portable, null, 2);
}

/** Encrypt a single day to a self-contained JSON string downloadable as a file. */
export async function encryptedDayToJSON(day, password) {
  const portable = makePortable(day);
  const payloadStr = await encryptData(password, portable);
  const { salt, iv, ct } = JSON.parse(payloadStr);
  return JSON.stringify({ $encrypted: true, $version: VERSION, salt, iv, ct }, null, 2);
}

/**
 * Detect if a parsed JSON object is an encrypted callsheet.
 * Returns true if it has the $encrypted flag.
 */
export function isEncryptedJSON(obj) {
  return !!(obj && obj.$encrypted === true && obj.salt && obj.iv && obj.ct);
}

/**
 * Decrypt an encrypted callsheet JSON string with a password.
 * Throws if the password is wrong or the data is malformed.
 */
export async function decryptDayFromJSON(text, password) {
  const obj = JSON.parse(text);
  if (!isEncryptedJSON(obj)) throw new Error('Not an encrypted callsheet file.');
  const payloadStr = JSON.stringify({ salt: obj.salt, iv: obj.iv, ct: obj.ct });
  const portable = await decryptData(password, payloadStr);
  const day = hydratePortable(portable);
  if (!day) throw new Error('Decrypted data could not be parsed as a call sheet.');
  return day;
}

export function storeFromJSON(text) {
  try {
    const p = JSON.parse(text);
    if (!p.days || !Array.isArray(p.days)) return null;
    const days = p.days.map(d => hydratePortable(d));
    if (days.some(d => d === null)) return null;
    return {
      days,
      currentDayId: days[0]?.id,
      tweaks: p.tweaks || { showJP: false, showLogo: true },
    };
  } catch (e) {
    return null;
  }
}