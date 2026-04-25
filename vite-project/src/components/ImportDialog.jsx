import { useState, useRef, useEffect, useCallback } from 'react';
import { isEncryptedJSON } from '../share';
import { fetchBin, setCloudBin } from '../jsonbin';

/**
 * Props:
 *   onImport(text, password?)  — called with raw JSON text; password only if encrypted
 *   onFile()                   — opens a file picker (handled by App)
 *   onFollow(binId, password)  — called when user opts in to auto-refresh
 *   onClose()
 */
export default function ImportDialog({ onImport, onFile, onFollow, onClose }) {
  const [tab, setTab] = useState('paste');

  // paste tab
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef(null);

  // cloud tab
  const [binId, setBinId] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [cloudText, setCloudText] = useState('');
  const [cloudPassword, setCloudPassword] = useState('');
  const [cloudError, setCloudError] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);
  const binIdRef = useRef(null);

  useEffect(() => {
    if (tab === 'paste') textareaRef.current?.focus();
    if (tab === 'cloud') binIdRef.current?.focus();
  }, [tab]);

  useEffect(() => {
    // reset cloud state when switching away
    if (tab !== 'cloud') {
      setBinId(''); setFetchError(''); setCloudText(''); setCloudPassword(''); setCloudError('');
    }
    if (tab !== 'paste') {
      setText(''); setPassword(''); setError('');
    }
  }, [tab]);

  // paste tab: detect encrypted content
  const isEncrypted = (() => {
    if (!text.trim()) return false;
    try { return isEncryptedJSON(JSON.parse(text)); } catch { return false; }
  })();

  const canSubmit = text.trim() && (!isEncrypted || password) && !busy;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await onImport(text.trim(), isEncrypted ? password : undefined);
    } catch (err) {
      setError(err.message || 'Import failed.');
      setBusy(false);
    }
  }, [text, password, isEncrypted, canSubmit, onImport]);

  const handleFile = useCallback(() => {
    onClose();
    onFile();
  }, [onClose, onFile]);

  // cloud tab
  const cloudIsEncrypted = (() => {
    if (!cloudText) return false;
    try { return isEncryptedJSON(JSON.parse(cloudText)); } catch { return false; }
  })();

  const handleFetch = useCallback(async (e) => {
    e.preventDefault();
    if (!binId.trim()) return;
    setFetching(true); setFetchError(''); setCloudText(''); setCloudPassword(''); setCloudError('');
    try {
      const json = await fetchBin(binId.trim());
      setCloudText(json);
    } catch (err) {
      setFetchError(err.message || 'Fetch failed.');
    } finally {
      setFetching(false);
    }
  }, [binId]);

  const handleCloudImport = useCallback(async (e) => {
    e.preventDefault();
    if (!cloudText) return;
    setCloudBusy(true); setCloudError('');
    try {
      await onImport(cloudText, cloudIsEncrypted ? cloudPassword : undefined);
      setCloudBin(binId.trim(), cloudIsEncrypted ? cloudPassword : '');
      onFollow?.(binId.trim(), cloudIsEncrypted ? cloudPassword : '');
      onClose();
    } catch (err) {
      setCloudError(err.message || 'Import failed.');
      setCloudBusy(false);
    }
  }, [cloudText, cloudPassword, cloudIsEncrypted, onImport, binId, onFollow, onClose]);

  const cloudCanImport = cloudText && (!cloudIsEncrypted || cloudPassword) && !cloudBusy;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Import</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button className={tab === 'paste' ? 'active' : ''} onClick={() => setTab('paste')}>Paste / File</button>
          <button className={tab === 'cloud' ? 'active' : ''} onClick={() => setTab('cloud')}>Cloud ☁</button>
        </div>

        {tab === 'paste' && (
          <div className="modal-body">
            <p className="share-hint">Paste a call sheet JSON below, or choose a file.</p>

            <form onSubmit={handleSubmit}>
              <div className="import-textarea-wrap">
                <textarea
                  ref={textareaRef}
                  className="import-textarea"
                  placeholder='Paste JSON here — plain or encrypted {"$encrypted":true,…}'
                  value={text}
                  onChange={e => { setText(e.target.value); setError(''); }}
                  disabled={busy}
                  spellCheck={false}
                />
              </div>

              {isEncrypted && (
                <div className="share-enc-fields" style={{ marginTop: 8 }}>
                  <input
                    type="password"
                    placeholder="Password to decrypt"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    autoFocus
                    disabled={busy}
                  />
                </div>
              )}

              {error && <p className="share-enc-msg error" style={{ marginTop: 8 }}>{error}</p>}

              <div className="share-actions" style={{ marginTop: 12 }}>
                <button type="submit" className="primary" disabled={!canSubmit}>
                  {busy ? 'Importing…' : isEncrypted ? 'Decrypt & Import' : 'Import'}
                </button>
                <button type="button" onClick={handleFile}>
                  Choose file instead…
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'cloud' && (
          <div className="modal-body">
            <p className="share-hint">Enter the bin code shared with you to fetch the call sheet from the cloud.</p>

            <form onSubmit={handleFetch}>
              <div className="share-enc-fields">
                <div className="share-url-row">
                  <input
                    ref={binIdRef}
                    type="text"
                    placeholder="Bin ID (e.g. 6770c1aae41b4d34e487…)"
                    value={binId}
                    onChange={e => { setBinId(e.target.value); setFetchError(''); setCloudText(''); }}
                    disabled={fetching}
                    spellCheck={false}
                    className="share-url-input"
                  />
                  <button type="submit" className="primary" disabled={!binId.trim() || fetching}>
                    {fetching ? '…' : 'Fetch'}
                  </button>
                </div>
              </div>
              {fetchError && <p className="share-enc-msg error" style={{ marginTop: 8 }}>{fetchError}</p>}
            </form>

            {cloudText && (
              <form onSubmit={handleCloudImport} style={{ marginTop: 16 }}>
                <p className="share-enc-msg ok" style={{ marginBottom: 8 }}>
                  Fetched! {cloudIsEncrypted ? 'Enter the password to import.' : 'Ready to import.'}
                </p>
                {cloudIsEncrypted && (
                  <div className="share-enc-fields" style={{ marginBottom: 8 }}>
                    <input
                      type="password"
                      placeholder="Password"
                      value={cloudPassword}
                      onChange={e => { setCloudPassword(e.target.value); setCloudError(''); }}
                      autoFocus
                      disabled={cloudBusy}
                    />
                  </div>
                )}
                {cloudError && <p className="share-enc-msg error" style={{ marginBottom: 8 }}>{cloudError}</p>}
                <div className="share-actions">
                  <button type="submit" className="primary" disabled={!cloudCanImport}>
                    {cloudBusy ? 'Importing…' : cloudIsEncrypted ? 'Decrypt & Import' : 'Import'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
