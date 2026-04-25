import { useState, useCallback, useEffect, useRef } from 'react';
import { compressDayToURL, dayToJSON, storeToJSON, encryptedDayToJSON } from '../share';

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

  const compressed = compressDayToURL(currentDay);
  const baseURL = window.location.origin + window.location.pathname;
  const shareURL = `${baseURL}#/d/${compressed}`;

  useEffect(() => {
    if (mode === 'link' && linkRef.current) {
      linkRef.current.focus();
      linkRef.current.select();
    }
    // reset encrypted state when switching away
    if (mode !== 'encrypted') {
      setEncPassword(''); setEncConfirm(''); setEncError(''); setEncDone(false);
    }
  }, [mode]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleCopyLink = useCallback(() => {
    copyToClipboard(shareURL);
  }, [shareURL, copyToClipboard]);

  const handleCopyJSON = useCallback(() => {
    copyToClipboard(dayToJSON(currentDay));
  }, [currentDay, copyToClipboard]);

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

  const encPasswordsMatch = encPassword && encConfirm && encPassword === encConfirm;
  const encReady = encPasswordsMatch && !encBusy;

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
      </div>
    </div>
  );
}
