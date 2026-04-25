import { useState, useCallback } from 'react';
import { uid, completeWithClaude, tryRepairJSON, INTAKE_SYSTEM, esc, getApiKey, getApiModel, setApiKey, setApiModel } from '../utils';

export default function Intake({ currentDay, updateDay, onSwitchTab }) {
  const [step, setStep] = useState('input');
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [repairedNote, setRepairedNote] = useState('');
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [apiModel, setApiModelState] = useState(getApiModel());

  const apiKeyStatus = apiKey ? `using ${apiModel.replace('claude-', '')}` : 'built-in';
  const apiKeyActive = !!apiKey;
  const hint = apiKey
    ? `Using your API key · ${apiModel} · up to 8k output tokens`
    : 'Uses built-in Claude Haiku · output capped at ~1024 tokens';

  const runInterpret = useCallback(async () => {
    const txt = input.trim();
    if (!txt) { alert('Paste some text first.'); return; }
    setStep('loading');
    try {
      const raw = await completeWithClaude(`${INTAKE_SYSTEM}\n\n--- INPUT START ---\n${txt}\n--- INPUT END ---`);
      const clean = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
      let parsed, note = '';
      try {
        parsed = JSON.parse(clean);
      } catch (e1) {
        const repaired = tryRepairJSON(clean);
        try {
          parsed = JSON.parse(repaired);
          note = 'Output was truncated — some trailing content may be missing. Review carefully before publishing.';
        } catch (e2) {
          throw new Error('Could not parse model output. The response was likely truncated. Try pasting a smaller chunk. Error: ' + e1.message);
        }
      }
      setDraft(parsed);
      setRepairedNote(note);
      setStep('verify');
    } catch (e) {
      setError(e.message || String(e));
      setStep('error');
    }
  }, [input]);

  const publish = useCallback(() => {
    if (!draft) return;
    updateDay(d => {
      Object.assign(d.meta, draft.meta || {});
      if (Array.isArray(draft.sections) && draft.sections.length) {
        const action = confirm('OK = Replace existing sections with interpreted ones.\nCancel = Append to existing sections.');
        const fresh = draft.sections.map(s => ({ ...s, id: uid() }));
        if (action) d.sections = fresh;
        else d.sections.push(...fresh);
      }
    });
    onSwitchTab();
    setDraft(null);
    setInput('');
    setStep('input');
  }, [draft, updateDay, onSwitchTab]);

  const cancel = useCallback(() => {
    setDraft(null);
    setInput('');
    setStep('input');
  }, []);

  const saveApiKey = useCallback(() => {
    setApiKey(apiKey);
    setApiModel(apiModel);
  }, [apiKey, apiModel]);

  const clearApiKey = useCallback(() => {
    setApiKeyState('');
    setApiKey('');
  }, []);

  const renderMeta = () => {
    if (!draft?.meta) return null;
    const curMeta = currentDay.meta;
    return (
      <div className="preview-block">
        <h4>Header</h4>
        <table className="pv"><tbody>
          {Object.entries(draft.meta).map(([k, v]) => {
            const changed = (v || '') !== (curMeta[k] || '');
            return (
              <tr key={k}>
                <td className="k">{k}</td>
                <td
                  className={`v${changed ? ' changed' : ''}`}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => { draft.meta[k] = e.currentTarget.textContent; }}
                >
                  {v || ''}
                </td>
              </tr>
            );
          })}
        </tbody></table>
      </div>
    );
  };

  const renderSections = () => {
    if (!draft?.sections) return null;
    return draft.sections.map((sec, si) => (
      <div key={si} className="preview-block">
        <h4>{sec.title || sec.type} <span className="tag">{sec.type}</span></h4>
        {Array.isArray(sec.data) ? (
          sec.data.length === 0 ? (
            <p className="muted">(empty)</p>
          ) : (
            <table className="pv">
              <thead><tr>{Object.keys(sec.data[0]).map(c => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {sec.data.map((r, ri) => (
                  <tr key={ri}>
                    {Object.entries(r).map(([c, v]) => (
                      <td
                        key={c}
                        className="v"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => { draft.sections[si].data[ri][c] = e.currentTarget.textContent; }}
                      >
                        {v != null ? String(v) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : sec.data && typeof sec.data === 'object' ? (
          <table className="pv"><tbody>
            {Object.entries(sec.data).map(([c, v]) => (
              <tr key={c}>
                <td className="k">{c}</td>
                <td
                  className="v"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => { draft.sections[si].data[c] = e.currentTarget.textContent; }}
                >
                  {v || ''}
                </td>
              </tr>
            ))}
          </tbody></table>
        ) : null}
      </div>
    ));
  };

  return (
    <div className="intake">
      <h2>Intake</h2>
      <p className="lede">Paste raw info — messages, emails, notes, mixed EN/JP — and Claude will extract it into structured sections you can verify before publishing.</p>

      {step === 'input' && (
        <div id="intake-input">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste anything — WhatsApp messages, emails, voice notes, mixed languages. Claude will interpret and organize it."
          />
          <div className="actions">
            <button className="primary" onClick={runInterpret}>Interpret →</button>
            <span className="hint">{hint}</span>
          </div>

          <details className="api-key-block">
            <summary>
              <span>Claude API key <span className={`pill${apiKeyActive ? ' active' : ''}`}>{apiKeyStatus}</span></span>
              <span className="chev">▾</span>
            </summary>
            <div className="api-key-body">
              <p>
                Optional. Paste a Claude API key to run Intake with a larger output budget
                (up to 8k tokens, Sonnet 4.5) — useful for long pastes that hit the built-in cap.
                Stored only in this browser (localStorage). Leave blank to use the built-in Haiku.
              </p>
              <div className="api-key-row">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKeyState(e.target.value)}
                  placeholder="sk-ant-…"
                  autoComplete="off"
                  spellCheck="false"
                />
                <select value={apiModel} onChange={e => setApiModelState(e.target.value)}>
                  <option value="claude-sonnet-4-5">Sonnet 4.5 (best)</option>
                  <option value="claude-haiku-4-5">Haiku 4.5 (fast)</option>
                </select>
                <button onClick={saveApiKey}>Save</button>
                <button onClick={clearApiKey}>Clear</button>
              </div>
              <p className="warn">
                ⚠ Usage bills to your Anthropic account. Only paste a key on a browser you trust —
                any script on this page can read localStorage. Get one at{' '}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>.
              </p>
            </div>
          </details>
        </div>
      )}

      {step === 'loading' && (
        <div id="intake-loading">
          <div className="loader">
            <div className="spinner" />
            <div>Interpreting…</div>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div id="intake-verify">
          {repairedNote && (
            <div style={{ background: '#FFF3B0', border: '1px solid #CBB04F', color: '#5A4700', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
              {repairedNote}
            </div>
          )}
          <div id="intakePreview">
            {renderMeta()}
            {renderSections()}
          </div>
          <div className="actions">
            <button className="primary" onClick={publish}>Publish to Sheet →</button>
            <button onClick={cancel}>Cancel</button>
            <span className="hint">Yellow cells differ from the current sheet</span>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div id="intake-error">
          <h3>Something went wrong</h3>
          <div id="intakeError">{error}</div>
          <div className="actions">
            <button className="primary" onClick={runInterpret}>Retry</button>
            <button onClick={() => { setStep('input'); }}>Back to input</button>
          </div>
        </div>
      )}
    </div>
  );
}
