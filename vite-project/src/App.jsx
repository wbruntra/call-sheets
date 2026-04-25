import { useState, useCallback, useEffect } from 'react';
import { useCallSheet } from './hooks/useCallSheet';
import { useDialog } from './hooks/useDialog';
import { decompressDayFromURL, dayFromJSON, storeFromJSON, isEncryptedJSON, decryptDayFromJSON } from './share';
import { getCloudBin, setCloudBin, clearCloudBin, fetchBin } from './jsonbin';
import { useIsMobile, EditModeContext } from './components/EditModeContext';
import AppBar from './components/AppBar';
import Sheet from './components/Sheet';
import Intake from './components/Intake';
import TweaksPanel from './components/TweaksPanel';
import ShareDialog from './components/ShareDialog';
import ImportDialog from './components/ImportDialog';
import Dialog from './components/Dialog';

export default function App() {
  const [tab, setTab] = useState('sheet');
  const [editing, setEditing] = useState(true);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [cloudBin, setCloudBin] = useState(() => getCloudBin());
  const [syncStatus, setSyncStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const isMobile = useIsMobile();

  const {
    store, currentDay, updateDay, updateStore,
    switchDay, newDay, deleteDay, setTweak, resetAll
  } = useCallSheet();

  const effectiveEditing = isMobile ? false : editing;

  const { dialog, showAlert, showConfirm, showPasswordPrompt, closeDialog } = useDialog();

  useEffect(() => {
    document.body.classList.toggle('editing', effectiveEditing);
  }, [effectiveEditing]);

  useEffect(() => {
    document.body.classList.toggle('hide-jp', !store.tweaks.showJP);
    document.body.classList.toggle('hide-logo', !store.tweaks.showLogo);
    document.body.classList.toggle('tweaks-open', tweaksOpen);
  }, [store.tweaks.showJP, store.tweaks.showLogo, tweaksOpen]);

  // Auto-refresh from cloud bin on load
  useEffect(() => {
    if (!cloudBin) return;
    setSyncStatus('loading');
    fetchBin(cloudBin.binId)
      .then(json => decryptDayFromJSON(json, cloudBin.password))
      .then(day => {
        updateStore(s => {
          s.days = [day];
          s.currentDayId = day.id;
        });
        setSyncStatus('ok');
      })
      .catch(err => {
        console.warn('Auto-refresh failed:', err);
        setSyncStatus('error');
      });
  }, []);

  const handleUnfollow = useCallback(() => {
    clearCloudBin();
    setCloudBin(null);
    setSyncStatus(null);
  }, []);

  // Load shared data from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    // Cloud link: #/c/<binId> — fetch from jsonbin, prompt for password if encrypted
    if (hash.startsWith('#/c/')) {
      const binId = hash.slice(3).trim();
      if (!binId) return;
      setSyncStatus('loading');
      fetchBin(binId)
        .then(json => {
          const obj = JSON.parse(json);
          if (isEncryptedJSON(obj)) {
            setSyncStatus(null);
            showPasswordPrompt({
              title: 'Cloud call sheet',
              message: 'This call sheet is password-protected. Enter the password to open it.',
            }).then(password => {
              if (!password) { window.history.replaceState(null, '', window.location.pathname); return; }
              setSyncStatus('loading');
              decryptDayFromJSON(json, password)
                .then(day => {
                  updateStore(s => { s.days = [day]; s.currentDayId = day.id; });
                  setCloudBin(binId, password);
                  setSyncStatus('ok');
                  window.history.replaceState(null, '', window.location.pathname);
                })
                .catch(() => {
                  showAlert({ title: 'Decryption failed', message: 'Wrong password or corrupted data.' });
                  setSyncStatus('error');
                  window.history.replaceState(null, '', window.location.pathname);
                });
            });
            return;
          }
          // Unencrypted
          const day = dayFromJSON(json);
          if (!day) {
            showAlert({ title: 'Import failed', message: 'Could not parse the cloud data.' });
            setSyncStatus('error');
            return;
          }
          updateStore(s => { s.days = [day]; s.currentDayId = day.id; });
          setCloudBin(binId, '');
          setSyncStatus('ok');
          window.history.replaceState(null, '', window.location.pathname);
        })
        .catch(err => {
          console.warn('Cloud link fetch failed:', err);
          showAlert({ title: 'Import failed', message: err.message || 'Could not fetch cloud data.' });
          setSyncStatus('error');
          window.history.replaceState(null, '', window.location.pathname);
        });
      return;
    }
    // Compressed data link: #/d/<data>
    if (!hash.startsWith('#/d/')) return;
    const compressed = hash.slice(4);
    if (!compressed) return;
    const day = decompressDayFromURL(compressed);
    if (!day) {
      showAlert({ title: 'Import failed', message: 'Could not load shared call sheet data.' });
      return;
    }
    showConfirm({
      title: 'Shared call sheet',
      message: 'You opened a shared call sheet. Would you like to replace your current day or add it as a new day?',
      confirmLabel: 'Replace current day',
      cancelLabel: 'Add as new day',
    }).then(replace => {
      if (replace) {
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
    });
  }, []);

  const handleImportCSV = useCallback(() => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.csv,text/csv';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        import('./utils.js').then(async ({ parseCSVtoDrafts, uid }) => {
          try {
            const drafts = parseCSVtoDrafts(fr.result);
            if (drafts.length === 0) {
              showAlert({ title: 'Empty file', message: 'No content found in CSV.' });
              return;
            }
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
            const replace = await showConfirm({
              title: 'Multiple days',
              message: `This CSV contains ${drafts.length} days. Replace all current days, or append them?`,
              confirmLabel: 'Replace all',
              cancelLabel: 'Append',
            });
            const fresh = drafts.map(d => ({
              id: uid(), meta: d.meta || {}, logos: [], pageBreaks: [],
              sections: (d.sections || []).map(s => ({ ...s, id: uid() }))
            }));
            if (replace) {
              updateStore(s => { s.days = fresh; s.currentDayId = fresh[0].id; });
            } else {
              updateStore(s => { s.days.push(...fresh); s.currentDayId = fresh[0].id; });
            }
          } catch (e) {
            showAlert({ title: 'CSV error', message: 'CSV parse error: ' + e.message });
          }
        });
      };
      fr.readAsText(f);
    };
    inp.click();
  }, [updateDay, updateStore, showAlert, showConfirm]);

  // Shared import logic used by both the ImportDialog (paste) and the file picker
  const processImportText = useCallback(async (text, password) => {
    // Encrypted callsheet
    try {
      const obj = JSON.parse(text);
      if (isEncryptedJSON(obj)) {
        if (!password) throw new Error('Password required for encrypted file.');
        const day = await decryptDayFromJSON(text, password);
        const replace = await showConfirm({
          title: 'Import encrypted call sheet',
          message: 'Replace your current day with the imported data, or add it as a new day?',
          confirmLabel: 'Replace current day',
          cancelLabel: 'Add as new day',
        });
        if (replace) {
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
      const replace = await showConfirm({
        title: 'Import call sheet',
        message: 'Replace your current day with the imported data, or add it as a new day?',
        confirmLabel: 'Replace current day',
        cancelLabel: 'Add as new day',
      });
      if (replace) {
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
      const replace = await showConfirm({
        title: `Import ${imported.days.length} call sheet${imported.days.length === 1 ? '' : 's'}`,
        message: `Replace all your current days with the ${imported.days.length} imported day${imported.days.length === 1 ? '' : 's'}, or append them?`,
        confirmLabel: 'Replace all',
        cancelLabel: 'Append',
      });
      if (replace) {
        updateStore(s => { s.days = imported.days; s.currentDayId = imported.currentDayId; s.tweaks = imported.tweaks; });
      } else {
        updateStore(s => { s.days.push(...imported.days); s.currentDayId = imported.days[0].id; });
      }
      setImportOpen(false);
      return;
    }

    throw new Error('Could not parse JSON. Make sure it was exported from Call Sheet.');
  }, [updateDay, updateStore, showConfirm]);

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
              const password = await showPasswordPrompt({
                title: 'Encrypted file',
                message: 'This file is password-protected. Enter the password to open it.',
              });
              if (!password) return;
              try { await processImportText(fr.result, password); }
              catch { showAlert({ title: 'Decryption failed', message: 'Wrong password or corrupted file — could not decrypt.' }); }
              return;
            }
          } catch {}
          showAlert({ title: 'Import error', message: e.message });
        }
      };
      fr.readAsText(f);
    };
    inp.click();
  }, [processImportText, showPasswordPrompt, showAlert]);

  const handleExportCSV = useCallback(() => {
    import('./utils.js').then(async ({ dayToCSVLines }) => {
      let scope = 'current';
      if (store.days.length > 1) {
        const all = await showConfirm({
          title: 'Export CSV',
          message: `You have ${store.days.length} days. Export all of them or just the current day?`,
          confirmLabel: 'Export all days',
          cancelLabel: 'Current day only',
        });
        scope = all ? 'all' : 'current';
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
  }, [store.days, currentDay, showConfirm]);

  return (
    <EditModeContext.Provider value={{ editing: effectiveEditing, isMobile }}>
      {cloudBin && (
        <div className={`sync-banner sync-banner--${syncStatus || 'loading'}`}>
          {syncStatus === 'loading' && 'Fetching latest call sheet…'}
          {syncStatus === 'ok' && `Synced from cloud · ${cloudBin.binId.slice(0, 8)}…`}
          {syncStatus === 'error' && 'Could not reach cloud — showing last cached version'}
          <button className="sync-banner-unfollow" onClick={handleUnfollow} title="Stop following">
            Unfollow ×
          </button>
        </div>
      )}
      <AppBar
        store={store}
        currentDay={currentDay}
        tab={tab}
        setTab={setTab}
        editing={editing}
        setEditing={setEditing}
        isMobile={isMobile}
        switchDay={switchDay}
        newDay={newDay}
        deleteDay={deleteDay}

        onImportJSON={() => setImportOpen(true)}

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
        followedBin={cloudBin}
        onUnfollow={handleUnfollow}
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
          onFollow={(binId, password) => { setCloudBin({ binId, password }); setSyncStatus('ok'); }}
          onClose={() => setImportOpen(false)}
        />
      )}

      <Dialog dialog={dialog} onClose={closeDialog} />
    </EditModeContext.Provider>
  );
}
