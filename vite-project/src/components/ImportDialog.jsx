import { useState, useRef, useEffect, useCallback } from 'react';
import { isEncryptedJSON } from '../share';

/**
 * Props:
 *   onImport(text, password?)  — called with raw JSON text; password only if encrypted
 *   onFile()                   — opens a file picker (handled by App)
 *   onClose()
 */
export default function ImportDialog({ onImport, onFile, onClose }) {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  // Detect if pasted content is encrypted
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Import</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

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
      </div>
    </div>
  );
}
