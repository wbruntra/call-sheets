import { useCallback } from 'react';
import { useEditMode } from './EditModeContext';

export default function EquipmentSection({ sec, updateSection }) {
  const { isMobile } = useEditMode();

  const handleTextChange = useCallback((i, text) => {
    updateSection(s => { s.data[i].text = text; });
  }, [updateSection]);

  const handleToggle = useCallback((i) => {
    updateSection(s => { s.data[i].done = !s.data[i].done; });
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
        if (!confirm('Delete item?')) return;
        s.data.splice(i, 1);
      }
    });
  }, [updateSection]);

  const handleAdd = useCallback(() => {
    updateSection(s => { s.data.push({ text: '', done: false }); });
  }, [updateSection]);

  if (isMobile) {
    return (
      <div className="equip-mobile">
        {sec.data.map((item, i) => (
          <div
            key={i}
            className={`equip-card${item.done ? ' done' : ''}`}
            onClick={() => handleToggle(i)}
          >
            <span className={`equip-check${item.done ? ' checked' : ''}`}>
              {item.done && '✓'}
            </span>
            <span className="equip-text">{item.text}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="equip-list">
        {sec.data.map((item, i) => (
          <div className={`chk${item.done ? ' done' : ''}`} key={i}>
            <span className="box" onClick={() => handleToggle(i)} />
            <span
              className="txt"
              contentEditable
              suppressContentEditableWarning
              onBlur={e => handleTextChange(i, e.currentTarget.textContent)}
              data-placeholder="Item"
            >
              {item.text}
            </span>
            <span className="row-ctrls">
              <button onClick={() => handleAction(i, 'up')} title="Move up">↑</button>
              <button onClick={() => handleAction(i, 'down')} title="Move down">↓</button>
              <button className="rm" onClick={() => handleAction(i, 'del')} title="Delete">×</button>
            </span>
          </div>
        ))}
      </div>
      <div className="add-row">
        <button onClick={handleAdd}>+ Add item</button>
      </div>
    </>
  );
}