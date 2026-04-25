import { useState, useEffect, useRef } from 'react';

/**
 * Generic modal driven by the `dialog` state from useDialog().
 * Types: 'alert' | 'confirm' | 'password'
 */
export default function Dialog({ dialog, onClose }) {
  const [password, setPassword] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (dialog) {
      setPassword('');
      // Focus primary action or input on open
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [dialog]);

  if (!dialog) return null;

  const { type, title, message } = dialog;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose(type === 'confirm' ? false : null);
    if (e.key === 'Enter' && type === 'alert') onClose(undefined);
    if (e.key === 'Enter' && type === 'password' && password) onClose(password);
  };

  return (
    <div className="modal-overlay" onKeyDown={handleKeyDown}>
      <div className="modal dialog-modal" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
          </div>
        )}

        <div className="modal-body">
          <p className="dialog-message">{message}</p>

          {type === 'password' && (
            <div className="share-enc-fields" style={{ marginTop: 12 }}>
              <input
                ref={inputRef}
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          )}

          <div className={`dialog-actions ${type === 'confirm' ? 'dialog-actions--row' : ''}`}>
            {type === 'alert' && (
              <button
                ref={inputRef}
                className="primary"
                onClick={() => onClose(undefined)}
              >
                OK
              </button>
            )}

            {type === 'confirm' && (
              <>
                <button className="primary" onClick={() => onClose(true)}>
                  {dialog.confirmLabel}
                </button>
                <button onClick={() => onClose(false)}>
                  {dialog.cancelLabel}
                </button>
              </>
            )}

            {type === 'password' && (
              <>
                <button
                  className="primary"
                  disabled={!password}
                  onClick={() => onClose(password)}
                >
                  Unlock
                </button>
                <button onClick={() => onClose(null)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
