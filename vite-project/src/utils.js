export const uid = () => Math.random().toString(36).slice(2, 9);

export function esc(s) {
  return (s == null ? '' : String(s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const CS_KEY = 'callsheet.app.v2';
export const CS_KEY_V1 = 'callsheet.app.v1';

export const API_KEY_STORAGE = 'callsheet.claudeApiKey';
export const API_MODEL_STORAGE = 'callsheet.claudeModel';

export function getApiKey() {
  try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch { return ''; }
}

export function getApiModel() {
  try { return localStorage.getItem(API_MODEL_STORAGE) || 'claude-sonnet-4-5'; } catch { return 'claude-sonnet-4-5'; }
}

export function setApiKey(v) {
  try {
    if (v) localStorage.setItem(API_KEY_STORAGE, v);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {}
}

export function setApiModel(m) {
  try { localStorage.setItem(API_MODEL_STORAGE, m); } catch {}
}

export async function completeWithClaude(userContent) {
  const key = getApiKey();
  if (key) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: getApiModel(),
        max_tokens: 8000,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message || ''; } catch {}
      throw new Error(`Claude API ${res.status}: ${detail || res.statusText}`);
    }
    const json = await res.json();
    return (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }
  if (!window.claude?.complete) {
    throw new Error('No API key set and built-in Claude helper is not available. Save an API key in the panel below.');
  }
  return await window.claude.complete({
    messages: [{ role: 'user', content: userContent }],
  });
}

import { SYSTEM_PROMPT } from './data/systemPrompt';

export const INTAKE_SYSTEM = SYSTEM_PROMPT;

export function tryRepairJSON(s) {
  s = s.trim();
  s = s.replace(/,\s*$/, '');
  const stack = [];
  let inStr = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') stack.pop();
  }
  if (inStr) s += '"';
  s = s.replace(/,?\s*"[^"]*"\s*:\s*$/, '');
  s = s.replace(/,\s*$/, '');
  while (stack.length) {
    const o = stack.pop();
    s += (o === '{' ? '}' : ']');
  }
  return s;
}

export function csvEscape(s) {
  s = s == null ? '' : String(s);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function dayToCSVLines(day) {
  const lines = [];
  lines.push('# META'); lines.push('key,value');
  Object.entries(day.meta).forEach(([k, v]) => lines.push(`${csvEscape(k)},${csvEscape(v)}`));
  lines.push('');
  day.sections.forEach(sec => {
    lines.push(`# ${sec.type.toUpperCase()} · ${sec.title}`);
    if (Array.isArray(sec.data)) {
      if (sec.data.length === 0) { lines.push(''); return; }
      const cols = Object.keys(sec.data[0]);
      lines.push(cols.join(','));
      sec.data.forEach(r => lines.push(cols.map(c => csvEscape(r[c])).join(',')));
    } else if (sec.data && typeof sec.data === 'object') {
      lines.push('key,value');
      Object.entries(sec.data).forEach(([k, v]) => lines.push(`${csvEscape(k)},${csvEscape(v)}`));
    }
    lines.push('');
  });
  return lines;
}

export function parseCSV(txt) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) {
      if (ch === '"' && txt[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch === '\r') {}
      else cur += ch;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export function parseCSVtoDrafts(txt) {
  const rows = parseCSV(txt);
  const drafts = [];
  let draft = null;
  let mode = null, header = null, cur = null;
  const ensureDraft = () => {
    if (!draft) { draft = { meta: {}, sections: [] }; drafts.push(draft); }
    return draft;
  };
  for (const r of rows) {
    if (r.length === 1 && r[0] === '') { mode = null; continue; }
    const first = (r[0] || '').trim();
    if (first.startsWith('# DAY')) { draft = { meta: {}, sections: [] }; drafts.push(draft); mode = null; header = null; cur = null; continue; }
    if (first.startsWith('# META')) { ensureDraft(); mode = 'meta'; continue; }
    if (first.startsWith('# ')) {
      const body = first.slice(2).trimStart();
      const [typeRaw, ...titleParts] = body.split(' · ');
      const type = typeRaw.trim().toLowerCase();
      const VALID = ['schedule', 'contacts', 'equipment', 'hospital', 'basecamp', 'notes'];
      if (!VALID.includes(type)) { mode = null; cur = null; header = null; continue; }
      ensureDraft();
      const title = titleParts.join(' · ').trim();
      cur = { id: uid(), type, title, data: ['hospital', 'basecamp', 'notes'].includes(type) ? {} : [] };
      draft.sections.push(cur);
      mode = 'sec'; header = null; continue;
    }
    if (mode === 'meta') {
      if (r[0] === 'key' && r[1] === 'value') continue;
      ensureDraft().meta[r[0]] = r[1];
    } else if (mode === 'sec' && cur) {
      if (!header) { header = r; continue; }
      if (Array.isArray(cur.data)) {
        const obj = {};
        header.forEach((h, i) => obj[h] = r[i] || '');
        if (cur.type === 'equipment' && 'done' in obj) obj.done = obj.done === 'true';
        cur.data.push(obj);
      } else {
        cur.data[r[0]] = r[1];
      }
    }
  }
  return drafts;
}