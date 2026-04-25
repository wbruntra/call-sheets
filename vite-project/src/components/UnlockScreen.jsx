import { useState } from 'react';
import { decryptData } from '../crypto.js';
import { ENCRYPTED_DEFAULT } from '../data/defaults.js';

/**
 * Password gate shown on first load when ENCRYPTED_DEFAULT is set and
 * no locally-saved call sheet data exists yet.
 *
 * Props:
 *   onUnlock(decryptedData) — called with the parsed default-schedule object
 *   onSkip()               — called if user wants to start blank instead
 */
export default function UnlockScreen({ onUnlock, onSkip }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const data = await decryptData(password, ENCRYPTED_DEFAULT);
      onUnlock(data);
    } catch {
      setError('Wrong password — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'var(--bg, #f5f4f0)', fontFamily: 'inherit',
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: '2.5rem 3rem',
        boxShadow: '0 2px 24px rgba(0,0,0,.10)', maxWidth: 360, width: '90%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700 }}>
          Enter password to load default schedule
        </h2>
        <p style={{ margin: '0 0 1.5rem', fontSize: '.85rem', color: '#666' }}>
          The default schedule is protected.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Password"
            autoFocus
            disabled={loading}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px', fontSize: '1rem',
              border: `1.5px solid ${error ? '#e53' : '#ddd'}`,
              borderRadius: 6, outline: 'none', marginBottom: 10,
            }}
          />
          {error && (
            <p style={{ margin: '0 0 10px', fontSize: '.82rem', color: '#e53' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', padding: '9px', fontSize: '.95rem', fontWeight: 600,
              background: loading ? '#999' : '#222', color: '#fff',
              border: 'none', borderRadius: 6, cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Decrypting…' : 'Unlock'}
          </button>
        </form>
        <button
          onClick={onSkip}
          disabled={loading}
          style={{
            marginTop: 12, background: 'none', border: 'none',
            color: '#888', fontSize: '.82rem', cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Start with a blank sheet instead
        </button>
      </div>
    </div>
  );
}
