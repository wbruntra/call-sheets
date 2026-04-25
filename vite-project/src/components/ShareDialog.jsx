import { useState, useCallback, useEffect, useRef } from 'react';
import { compressDayToURL, dayToJSON, storeToJSON, encryptedDayToJSON } from '../share';
import { uploadBin, updateBin, getCloudBin, setCloudBin, getApiKey, setApiKey } from '../jsonbin';

export default function ShareDialog({ currentDay, store, onClose }) {
  const [mode, setMode] = useState('link');
  const [copied, setCopied] = useState(false);
  const linkRef = useRef(null);

  // encrypted export state
  const [encPassword, setEncPassword] = useState('');
  const [encConfirm, setEncConfirm] = useState('');
  const [encBusy, setEncBusy] = useState(false);
  const [encError, setEncError] = useState('');
  const [encDone, setEncDone] = useState(false);

  // cloud upload state
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [cloudPassword, setCloudPassword] = useState('');
  const [cloudConfirm, setCloudConfirm] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [cloudBinId, setCloudBinId] = useState('');
  const [cloudCopied, setCloudCopied] = useState(false);
  const [cloudUpdateMsg, setCloudUpdateMsg] = useState('');

  const savedBin = getCloudBin();

  const compressed = compressDayToURL(currentDay);
  const baseURL = window.location.origin + window.location.pathname;
  const shareURL = `${baseURL}#/d/${compressed}`;

  useEffect(() => {
    if (mode === 'link' && linkRef.current) {
      linkRef.current.focus();
      linkRef.current.select();
    }
    if (mode !== 'encrypted') {
      setEncPassword(''); setEncConfirm(''); setEncError(''); setEncDone(false);
    }
    if (mode !== 'cloud') {
      setCloudPassword(''); setCloudConfirm(''); setCloudError(''); setCloudBinId(''); setCloudCopied(false); setCloudUpdateMsg('');
    }
  }, [mode]);

  const copyToClipboard = useCallback(async (text, setCopiedFn) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  }, []);

  const handleCopyLink = useCallback(() => copyToClipboard(shareURL, setCopied), [shareURL, copyToClipboard]);
  const handleCopyJSON = useCallback(() => copyToClipboard(dayToJSON(currentDay), setCopied), [currentDay, copyToClipboard]);

  const handleDownloadJSON = useCallback(() => {
    const json = dayToJSON(currentDay);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const slug = (currentDay.meta?.date || 'call-sheet').replace(/[^\w.-]/g, '_');
    a.download = `${slug}.callsheet.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [currentDay]);

  const handleDownloadAllJSON = useCallback(() => {
    const json = storeToJSON(store);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'call-sheets.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [store]);

  const handleDownloadEncrypted = useCallback(async (e) => {
    e.preventDefault();
    if (encPassword !== encConfirm) { setEncError('Passwords do not match.'); return; }
    if (encPassword.length < 4) { setEncError('Password must be at least 4 characters.'); return; }
    setEncBusy(true); setEncError('');
    try {
      const json = await encryptedDayToJSON(currentDay, encPassword);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const slug = (currentDay.meta?.date || 'call-sheet').replace(/[^\w.-]/g, '_');
      a.download = `${slug}.enc.callsheet.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setEncDone(true);
      setEncPassword(''); setEncConfirm('');
      setTimeout(() => setEncDone(false), 3000);
    } catch (err) {
      setEncError('Encryption failed: ' + err.message);
    } finally {
      setEncBusy(false);
    }
  }, [currentDay, encPassword, encConfirm]);

  const handleCloudUpload = useCallback(async (e) => {
    e.preventDefault();
    if (cloudPassword !== cloudConfirm) { setCloudError('Passwords do not match.'); return; }
    if (cloudPassword.length < 4) { setCloudError('Password must be at least 4 characters.'); return; }
    setCloudBusy(true); setCloudError(''); setCloudBinId('');
    try {
      const json = await encryptedDayToJSON(currentDay, cloudPassword);
      const binId = await uploadBin(json, apiKey);
      setCloudBinId(binId);
      setCloudBin(binId, cloudPassword);
      setCloudPassword(''); setCloudConfirm('');
    } catch (err) {
      setCloudError(err.message || 'Upload failed.');
    } finally {
      setCloudBusy(false);
    }
  }, [currentDay, cloudPassword, cloudConfirm, apiKey]);

  const handleCloudUpdate = useCallback(async () => {
    const bin = getCloudBin();
    if (!bin) return;
    setCloudBusy(true); setCloudError(''); setCloudUpdateMsg('');
    try {
      const json = await encryptedDayToJSON(currentDay, bin.password);
      await updateBin(bin.binId, json, apiKey);
      setCloudUpdateMsg('Updated!');
      setTimeout(() => setCloudUpdateMsg(''), 3000);
    } catch (err) {
      setCloudError(err.message || 'Update failed.');
    } finally {
      setCloudBusy(false);
    }
  }, [currentDay, apiKey]);

  const encPasswordsMatch = encPassword && encConfirm && encPassword === encConfirm;
  const encReady = encPasswordsMatch && !encBusy;
  const cloudPasswordsMatch = cloudPassword && cloudConfirm && cloudPassword === cloudConfirm;
  const cloudReady = cloudPasswordsMatch && !cloudBusy && !!apiKey;

  const activeBinId = cloudBinId || savedBin?.binId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button className={mode === 'link' ? 'active' : ''} onClick={() => setMode('link')}>Link</button>
          <button className={mode === 'json' ? 'active' : ''} onClick={() => setMode('json')}>JSON</button>
          <button className={mode === 'encrypted' ? 'active' : ''} onClick={() => setMode('encrypted')}>Encrypted</button>
          <button className={mode === 'cloud' ? 'active' : ''} onClick={() => setMode('cloud')}>Cloud ☁</button>
        </div>

        {mode === 'link' && (
          <div className="modal-body">
            <p className="share-hint">Send this link to anyone. They'll get a fully populated call sheet — no account needed. Logos are not included in links.</p>
            <div className="share-url-row">
              <input
                ref={linkRef}
                type="text"
                readOnly
                value={shareURL}
                className="share-url-input"
                onClick={e => e.target.select()}
              />
              <button className="primary" onClick={handleCopyLink}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {mode === 'json' && (
          <div className="modal-body">
            <p className="share-hint">Export as JSON for backups, cross-device transfer, or archiving. JSON preserves all data including logos.</p>
            <div className="share-actions">
              <button onClick={handleDownloadJSON}>Download current day (.json)</button>
              <button onClick={handleDownloadAllJSON}>Download all days (.json)</button>
              <button onClick={handleCopyJSON}>{copied ? 'Copied!' : 'Copy to clipboard'}</button>
            </div>
          </div>
        )}

        {mode === 'encrypted' && (
          <div className="modal-body">
            <p className="share-hint">
              Export the current day as a password-protected file. The recipient will need the password to open it.
            </p>
            <form onSubmit={handleDownloadEncrypted}>
              <div className="share-enc-fields">
                <input
                  type="password"
                  placeholder="Set a password"
                  value={encPassword}
                  onChange={e => { setEncPassword(e.target.value); setEncError(''); setEncDone(false); }}
                  autoComplete="new-password"
                  disabled={encBusy}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={encConfirm}
                  onChange={e => { setEncConfirm(e.target.value); setEncError(''); setEncDone(false); }}
                  autoComplete="new-password"
                  disabled={encBusy}
                  className={!encConfirm ? '' : encPasswordsMatch ? 'match' : 'mismatch'}
                />
              </div>
              {encError && <p className="share-enc-msg error">{encError}</p>}
              {encDone && <p className="share-enc-msg ok">Downloaded — keep the password safe!</p>}
              <div className="share-actions">
                <button type="submit" className="primary" disabled={!encReady}>
                  {encBusy ? 'Encrypting…' : 'Download encrypted (.json)'}
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'cloud' && (
          <div className="modal-body">
            <p className="share-hint">
              Encrypt and upload the current day to the cloud. The recipient gets a short code — no file transfer needed. On reload, the app automatically fetches the latest version.
            </p>

            <div className="share-enc-fields" style={{ marginBottom: 12 }}>
              <input
                type="text"
                placeholder="JSONBin.io API key"
                value={apiKey}
                onChange={e => { setApiKeyState(e.target.value); setApiKey(e.target.value); setCloudError(''); }}
                spellCheck={false}
              />
            </div>
            <p className="share-hint" style={{ marginTop: -8, marginBottom: 12 }}>
              Get a free key at <a href="https://jsonbin.io/api-keys" target="_blank" rel="noopener">jsonbin.io/api-keys</a>. Only needed for uploading — recipients just need the bin code.
            </p>

            {!activeBinId ? (
              <form onSubmit={handleCloudUpload}>
                <div className="share-enc-fields">
                  <input
                    type="password"
                    placeholder="Set a password for this call sheet"
                    value={cloudPassword}
                    onChange={e => { setCloudPassword(e.target.value); setCloudError(''); }}
                    autoComplete="new-password"
                    disabled={cloudBusy}
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={cloudConfirm}
                    onChange={e => { setCloudConfirm(e.target.value); setCloudError(''); }}
                    autoComplete="new-password"
                    disabled={cloudBusy}
                    className={!cloudConfirm ? '' : cloudPasswordsMatch ? 'match' : 'mismatch'}
                  />
                </div>
                {cloudError && <p className="share-enc-msg error">{cloudError}</p>}
                <div className="share-actions" style={{ marginTop: 12 }}>
                  <button type="submit" className="primary" disabled={!cloudReady}>
                    {cloudBusy ? 'Uploading…' : 'Encrypt & upload'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="cloud-result">
                <p className="share-hint" style={{ marginBottom: 8 }}>
                  Uploaded! Share this code with the recipient — they'll also need the password.
                </p>
                <div className="share-url-row">
                  <input
                    type="text"
                    readOnly
                    value={activeBinId}
                    className="share-url-input cloud-binid"
                    onClick={e => e.target.select()}
                  />
                  <button
                    className="primary"
                    onClick={() => copyToClipboard(activeBinId, setCloudCopied)}
                  >
                    {cloudCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {cloudUpdateMsg && <p className="share-enc-msg ok" style={{ marginTop: 12 }}>{cloudUpdateMsg}</p>}
                {cloudError && <p className="share-enc-msg error" style={{ marginTop: 8 }}>{cloudError}</p>}
                <div className="share-actions" style={{ marginTop: 12 }}>
                  <button className="primary" disabled={cloudBusy || !apiKey} onClick={handleCloudUpdate}>
                    {cloudBusy ? 'Updating…' : 'Push update'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}