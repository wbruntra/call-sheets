const API = 'https://api.jsonbin.io/v3';
const API_KEY_STORAGE = 'callsheets_api_key';
const CLOUD_KEY = 'callsheets_cloud';

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

export function getCloudBin() {
  try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || null; }
  catch { return null; }
}

export function setCloudBin(binId, password) {
  localStorage.setItem(CLOUD_KEY, JSON.stringify({ binId, password }));
}

export function clearCloudBin() {
  localStorage.removeItem(CLOUD_KEY);
}

export async function uploadBin(encryptedJsonStr, apiKey) {
  if (!apiKey) throw new Error('API key required. Enter your JSONBin.io key above.');
  const record = JSON.parse(encryptedJsonStr);
  const res = await fetch(`${API}/b`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey,
      'X-Bin-Private': 'false',
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status})${text ? ': ' + text : ''}`);
  }
  const data = await res.json();
  return data.metadata.id;
}

export async function updateBin(binId, encryptedJsonStr, apiKey) {
  if (!apiKey) throw new Error('API key required. Enter your JSONBin.io key above.');
  const record = JSON.parse(encryptedJsonStr);
  const res = await fetch(`${API}/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey,
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Update failed (${res.status})${text ? ': ' + text : ''}`);
  }
  return res.json();
}

export async function fetchBin(binId) {
  const id = binId.trim();
  const res = await fetch(`${API}/b/${id}/latest`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Bin not found. Check the ID and try again.');
    throw new Error(`Fetch failed (${res.status})`);
  }
  const data = await res.json();
  return JSON.stringify(data.record);
}