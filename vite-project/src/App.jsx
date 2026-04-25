import { useState, useCallback, useEffect } from 'react';
import { useCallSheet } from './hooks/useCallSheet';
import { decompressDayFromURL, dayFromJSON, storeFromJSON, isEncryptedJSON, decryptDayFromJSON } from './share';
import { EditModeContext } from './components/EditModeContext';
import AppBar from './components/AppBar';
import Sheet from './components/Sheet';
import Intake from './components/Intake';
import TweaksPanel from './components/TweaksPanel';
import ShareDialog from './components/ShareDialog';
import ImportDialog from './components/ImportDialog';

export default function App() {
  const [tab, setTab] = useState('sheet');
  const [editing, setEditing] = useState(true);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const {
    store, currentDay, updateDay, updateStore,
    switchDay, newDay, deleteDay, setTweak, resetAll
  } = useCallSheet();

  useEffect(() => {
    document.body.classList.toggle('editing', editing);
  }, [editing]);

  useEffect(() => {
    document.body.classList.toggle('hide-jp', !store.tweaks.showJP);
    document.body.classList.toggle('hide-logo', !store.tweaks.showLogo);
    document.body.classList.toggle('tweaks-open', tweaksOpen);
  }, [store.tweaks.showJP, store.tweaks.showLogo, tweaksOpen]);

  // Load shared data from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#/d/')) return;
    const compressed = hash.slice(4);
    if (!compressed) return;
    const day = decompressDayFromURL(compressed);
    if (!day) { alert('Could not load shared call sheet data.'); return; }
    const action = confirm(
      'You opened a shared call sheet.\n\nOK = Replace current day with shared data\nCancel = Add as a new day'
    );
    if (action) {
      updateDay(d => {
        Object.assign(d.meta, day.meta);
        d.logos = day.logos;
        d.sections = day.sections;
        d.pageBreaks = day.pageBreaks;
      });
    } else {
      updateStore(s => {
        s.days.push(day);
        s.currentDayId = day.id;
      });
    }
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleImportCSV = useCallback(() => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.csv,text/csv';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        import('./utils.js').then(({ parseCSVtoDrafts, uid }) => {
          try {
            const drafts = parseCSVtoDrafts(fr.result);
            if (drafts.length === 0) { alert('No content found in CSV.'); return; }
            if (drafts.length === 1) {
              const d = drafts[0];
              updateDay(day => {
                Object.assign(day.meta, d.meta || {});
                if (Array.isArray(d.sections) && d.sections.length) {
                  day.sections = d.sections.map(s => ({ ...s, id: uid() }));
                }
              });
              return;
            }
            const action = confirm(
              `This CSV contains ${drafts.length} days.\n\nOK = Replace all days\nCancel = Append as new days`
            );
            const fresh = drafts.map(d => ({
              id: uid(), meta: d.meta || {}, logos: [], pageBreaks: [],
              sections: (d.sections || []).map(s => ({ ...s, id: uid() }))
            }));
            if (action) {
              updateStore(s => { s.days = fresh; s.currentDayId = fresh[0].id; });
            } else {
              updateStore(s => { s.days.push(...fresh); s.currentDayId = fresh[0].id; });
            }
          } catch (e) { alert('CSV parse error: ' + e.message); }
        });
      };
      fr.readAsText(f);
    };
    inp.click();
  }, [updateDay, updateStore]);

  // Shared import logic used by both the ImportDialog (paste) and the file picker
  const processImportText = useCallback(async (text, password) => {
    // Encrypted callsheet
    try {
      const obj = JSON.parse(text);
      if (isEncryptedJSON(obj)) {
        if (!password) throw new Error('Password required for encrypted file.');
        const day = await decryptDayFromJSON(text, password);
        const action = confirm('Import encrypted call sheet.\n\nOK = Replace current day\nCancel = Add as new day');
        if (action) {
          updateDay(d => { Object.assign(d.meta, day.meta); d.logos = day.logos; d.sections = day.sections; d.pageBreaks = day.pageBreaks; });
        } else {
          updateStore(s => { s.days.push(day); s.currentDayId = day.id; });
        }
        setImportOpen(false);
        return;
      }
    } catch (e) {
      if (e.message === 'Password required for encrypted file.' || e.message?.includes('decrypt')) throw e;
      throw new Error('Wrong password or corrupted file.');
    }

    // Plain single day
    const day = dayFromJSON(text);
    if (day) {
      const action = confirm('Import call sheet.\n\nOK = Replace current day\nCancel = Add as new day');
      if (action) {
        updateDay(d => { Object.assign(d.meta, day.meta); d.logos = day.logos; d.sections = day.sections; d.pageBreaks = day.pageBreaks; });
      } else {
        updateStore(s => { s.days.push(day); s.currentDayId = day.id; });
      }
      setImportOpen(false);
      return;
    }

    // Multi-day store
    const imported = storeFromJSON(text);
    if (imported) {
      const action = confirm(`Import ${imported.days.length} call sheet(s).\n\nOK = Replace all days\nCancel = Append as new days`);
      if (action) {
        updateStore(s => { s.days = imported.days; s.currentDayId = imported.currentDayId; s.tweaks = imported.tweaks; });
      } else {
        updateStore(s => { s.days.push(...imported.days); s.currentDayId = imported.days[0].id; });
      }
      setImportOpen(false);
      return;
    }

    throw new Error('Could not parse JSON. Make sure it was exported from Call Sheet.');
  }, [updateDay, updateStore]);

  // File-picker path (used by "Choose file" in ImportDialog and legacy CSV handler)
  const handleImportJSONFile = useCallback(() => {
    const inp = document.createElement('input');
    inp.accept = '.json,application/json';
    inp.type = 'file';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          await processImportText(fr.result);
        } catch (e) {
          // encrypted files from file picker still need a password prompt
          try {
            const obj = JSON.parse(fr.result);
            if (isEncryptedJSON(obj)) {
              const password = prompt('This file is encrypted. Enter the password to open it:');
              if (!password) return;
              try { await processImportText(fr.result, password); }
              catch { alert('Wrong password or corrupted file — could not decrypt.'); }
              return;
            }
          } catch {}
          alert(e.message);
        }
      };
      fr.readAsText(f);
    };
    inp.click();
  }, [processImportText]);

  const handleExportCSV = useCallback(() => {
    import('./utils.js').then(({ dayToCSVLines }) => {
      let scope = 'current';
      if (store.days.length > 1) {
        const choice = confirm(
          `You have ${store.days.length} days.\n\nOK = Export ALL days\nCancel = Export current day only`
        );
        scope = choice ? 'all' : 'current';
      }
      const lines = [];
      const daysToExport = scope === 'all' ? store.days : [currentDay];
      daysToExport.forEach((day, i) => {
        const label = (day.meta?.date || `Day ${day.meta?.day || (i+1)}`).trim();
        if (scope === 'all') {
          lines.push(`# DAY · ${label}`);
          lines.push('');
        }
        lines.push(...dayToCSVLines(day));
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `call-sheet-${(currentDay.meta.date || 'export').replace(/[^\w.-]/g,'_')}.csv`;
      a.click();
    });
  }, [store.days, currentDay]);

  return (
    <EditModeContext.Provider value={editing}>
      <AppBar
        store={store}
        currentDay={currentDay}
        tab={tab}
        setTab={setTab}
        editing={editing}
        setEditing={setEditing}
        switchDay={switchDay}
        newDay={newDay}
        deleteDay={deleteDay}
        onImportCSV={handleImportCSV}
        onImportJSON={() => setImportOpen(true)}
        onExportCSV={handleExportCSV}
        onResetAll={resetAll}
        onOpenTweaks={() => setTweaksOpen(true)}
        onOpenShare={() => setShareOpen(true)}
      />

      {tab === 'sheet' && (
        <Sheet
          day={currentDay}
          updateDay={updateDay}
          store={store}
        />
      )}

      {tab === 'intake' && (
        <Intake
          currentDay={currentDay}
          updateDay={updateDay}
          onSwitchTab={() => setTab('sheet')}
        />
      )}

      <TweaksPanel
        open={tweaksOpen}
        onClose={() => setTweaksOpen(false)}
        tweaks={store.tweaks}
        setTweak={setTweak}
      />

      {shareOpen && (
        <ShareDialog
          currentDay={currentDay}
          store={store}
          onClose={() => setShareOpen(false)}
        />
      )}

      {importOpen && (
        <ImportDialog
          onImport={processImportText}
          onFile={handleImportJSONFile}
          onClose={() => setImportOpen(false)}
        />
      )}
    </EditModeContext.Provider>
  );
}
