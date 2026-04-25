import { useCallback } from 'react';
import { useEditMode } from './EditModeContext';

export default function ContactsSection({ sec, updateSection }) {
  const { isMobile } = useEditMode();

  const handleChange = useCallback((i, field, value) => {
    updateSection(s => { s.data[i][field] = value; });
  }, [updateSection]);

  const handleAction = useCallback((i, act) => {
    updateSection(s => {
      if (act === 'up' && i > 0) {
        const [r] = s.data.splice(i, 1);
        s.data.splice(i - 1, 0, r);
      }
      if (act === 'down' && i < s.data.length - 1) {
        const [r] = s.data.splice(i, 1);
        s.data.splice(i + 1, 0, r);
      }
      if (act === 'del') {
        if (!confirm('Delete contact?')) return;
        s.data.splice(i, 1);
      }
    });
  }, [updateSection]);

  const handleAdd = useCallback(() => {
    updateSection(s => { s.data.push({ role: '', name: '', phone: '' }); });
  }, [updateSection]);

  if (isMobile) {
    return (
      <div className="contacts-mobile">
        {sec.data.map((c, i) => {
          const isTel = c.phone && /^[\d+\-() ]+$/.test(c.phone);
          const isEmail = c.phone && c.phone.includes('@');
          return (
            <div key={i} className="contact-card">
              <span className="contact-role">{c.role}</span>
              <span className="contact-name">{c.name}</span>
              {c.phone && (
                isTel ? (
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="contact-phone">{c.phone}</a>
                ) : isEmail ? (
                  <a href={`mailto:${c.phone}`} className="contact-phone">{c.phone}</a>
                ) : (
                  <span className="contact-phone">{c.phone}</span>
                )
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="crew-grid-wrap">
        <div className="crew-grid">
          {sec.data.map((c, i) => (
            <div className="crew-row" key={i}>
              <span className="crew-ctrls">
                <button onClick={() => handleAction(i, 'up')} title="Move up">↑</button>
                <button onClick={() => handleAction(i, 'down')} title="Move down">↓</button>
                <button className="rm" onClick={() => handleAction(i, 'del')} title="Delete">×</button>
              </span>
              <span
                className="role"
                contentEditable
                suppressContentEditableWarning
                onBlur={e => handleChange(i, 'role', e.currentTarget.textContent)}
                data-placeholder="Role"
              >
                {c.role}
              </span>
              <span
                className="name"
                contentEditable
                suppressContentEditableWarning
                onBlur={e => handleChange(i, 'name', e.currentTarget.textContent)}
                data-placeholder="Name"
              >
                {c.name}
              </span>
              <span
                className="phone"
                contentEditable
                suppressContentEditableWarning
                onBlur={e => handleChange(i, 'phone', e.currentTarget.textContent)}
                data-placeholder="Phone / email"
              >
                {c.phone}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="add-row">
        <button onClick={handleAdd}>+ Add contact</button>
      </div>
    </>
  );
}