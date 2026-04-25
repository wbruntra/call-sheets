import { useState, useCallback, useEffect } from 'react';
import { produce } from 'immer';
import { uid, CS_KEY, CS_KEY_V1 } from '../utils';
import { BLANK_DAY_DATA } from '../data/defaults';

function fixupLogos(day) {
  if (day.logos) {
    if (day.logos[0] && !day.logos[0].dataUrl) day.logos[0].dataUrl = '/logo-bbc.png';
    if (day.logos[1] && !day.logos[1].dataUrl) day.logos[1].dataUrl = '/logo-sa.png';
  }
  if (!day.pageBreaks) day.pageBreaks = [];
}

function load() {
  try {
    const raw = localStorage.getItem(CS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.days && s.currentDayId) {
        s.days.forEach(fixupLogos);
        if (!s.tweaks) s.tweaks = { showJP: false, showLogo: true };
        return s;
      }
    }
    const v1 = localStorage.getItem(CS_KEY_V1);
    if (v1) {
      const s1 = JSON.parse(v1);
      const day = { id: uid(), meta: s1.meta || {}, logos: s1.logos || [], pageBreaks: s1.pageBreaks || [], sections: s1.sections || [] };
      fixupLogos(day);
      return { days: [day], currentDayId: day.id, tweaks: s1.tweaks || { showJP: false, showLogo: true } };
    }
  } catch (e) { console.warn('load fail', e); }
  const d = createDay(BLANK_DAY_DATA);
  return { days: [d], currentDayId: d.id, tweaks: { showJP: false, showLogo: true } };
}

function createDay(template) {
  return JSON.parse(JSON.stringify({ ...template, id: uid(), sections: template.sections.map(s => ({ ...s, id: uid(), data: Array.isArray(s.data) ? s.data.map(r => ({ ...r })) : { ...s.data } })) }));
}

export function useCallSheet(overrideDefault = null) {
  const [store, setStore] = useState(() => {
    // If a decrypted default is supplied it means localStorage was empty at unlock time
    if (overrideDefault) {
      const d = createDay(overrideDefault);
      return { days: [d], currentDayId: d.id, tweaks: { showJP: false, showLogo: true } };
    }
    return load();
  });

  const currentDay = store.days.find(d => d.id === store.currentDayId) || store.days[0];

  const updateDay = useCallback((updater) => {
    setStore(prev => produce(prev, draft => {
      const idx = draft.days.findIndex(d => d.id === draft.currentDayId);
      if (idx < 0) return;
      const day = draft.days[idx];
      updater(day);
    }));
  }, []);

  const updateStore = useCallback((updater) => {
    setStore(prev => produce(prev, draft => {
      updater(draft);
    }));
  }, []);

  const switchDay = useCallback((id) => {
    setStore(prev => produce(prev, draft => {
      if (!draft.days.find(d => d.id === id)) return;
      draft.currentDayId = id;
    }));
  }, []);

  const newDay = useCallback((mode = 'blank') => {
    const template = BLANK_DAY_DATA;
    const d = createDay(template);
    if (mode === 'duplicate') {
      const current = store.days.find(dd => dd.id === store.currentDayId);
      if (current) {
        d.meta = { ...current.meta, date: '', day: String((parseInt(current.meta?.day) || 0) + 1 || '') };
        d.sections.forEach(s => { if (s.type === 'schedule') s.data = []; });
      }
    } else if (mode === 'copy') {
      const current = store.days.find(dd => dd.id === store.currentDayId);
      if (current) {
        d.meta = { ...current.meta };
        d.sections = current.sections.map(s => ({ ...s, id: uid(), data: Array.isArray(s.data) ? s.data.map(r => ({ ...r })) : { ...s.data } }));
      }
    }
    setStore(prev => produce(prev, draft => {
      draft.days.push(d);
      draft.currentDayId = d.id;
    }));
    return d;
  }, [store]);

  const deleteDay = useCallback(() => {
    if (store.days.length <= 1) return false;
    setStore(prev => produce(prev, draft => {
      const idx = draft.days.findIndex(d => d.id === draft.currentDayId);
      draft.days.splice(idx, 1);
      draft.currentDayId = draft.days[Math.max(0, idx - 1)].id;
    }));
    return true;
  }, [store]);

  const setTweak = useCallback((key, value) => {
    setStore(prev => produce(prev, draft => {
      draft.tweaks[key] = value;
    }));
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(CS_KEY);
    const d = createDay(BLANK_DAY_DATA);
    const fresh = { days: [d], currentDayId: d.id, tweaks: { showJP: false, showLogo: true } };
    setStore(fresh);
    return fresh;
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(CS_KEY, JSON.stringify(store));
  }, [store]);

  return {
    store,
    currentDay,
    updateDay,
    updateStore,
    switchDay,
    newDay,
    deleteDay,
    setTweak,
    resetAll,
  };
}