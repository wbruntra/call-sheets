import { useCallback } from 'react';
import { useEditMode } from './EditModeContext';

export default function ScheduleSection({ sec, updateSection, updateDay }) {
  const { isMobile } = useEditMode();

  const handleFieldChange = useCallback((i, field, value) => {
    updateSection(s => { s.data[i][field] = value; });
  }, [updateSection]);

  const handleRowAction = useCallback((i, act) => {
    updateDay(d => {
      const s = d.sections.find(s => s.id === sec.id);
      if (!s) return;
      if (act === 'up' && i > 0) {
        const [r] = s.data.splice(i, 1);
        s.data.splice(i - 1, 0, r);
      }
      if (act === 'down' && i < s.data.length - 1) {
        const [r] = s.data.splice(i, 1);
        s.data.splice(i + 1, 0, r);
      }
      if (act === 'del') {
        if (!confirm('Delete row?')) return;
        s.data.splice(i, 1);
        d.pageBreaks = (d.pageBreaks || []).filter(p => !(p.beforeRow && p.beforeRow.sectionId === sec.id && p.beforeRow.idx === i));
      }
      if (act === 'brk') {
        const ex = (d.pageBreaks || []).findIndex(p => p.beforeRow && p.beforeRow.sectionId === sec.id && p.beforeRow.idx === i);
        if (ex >= 0) d.pageBreaks.splice(ex, 1);
        else (d.pageBreaks = d.pageBreaks || []).push({ beforeRow: { sectionId: sec.id, idx: i } });
      }
    });
  }, [updateDay, sec.id]);

  const addRow = useCallback(() => {
    updateSection(s => { s.data.push({ type: 'row', time: '', dur: '', task: '', loc: '', cast: '', note: '' }); });
  }, [updateSection]);

  const addSpan = useCallback(() => {
    updateSection(s => { s.data.push({ type: 'span', time: '', dur: '', text: '' }); });
  }, [updateSection]);

  const hasBreak = (i) => (sec.pageBreaks || []).some(p => p.beforeRow && p.beforeRow.sectionId === sec.id && p.beforeRow.idx === i);

  if (isMobile) {
    return (
      <div className="sched-mobile">
        {sec.data.map((r, i) => {
          if (r.type === 'span') {
            return (
              <div key={i} className="sched-card sched-card--span">
                <div className="sched-card-head">
                  {r.time && <span className="sched-time">{r.time}</span>}
                  {r.dur && <span className="sched-dur">{r.dur}</span>}
                </div>
                <div className="sched-span-text">{r.text}</div>
              </div>
            );
          }
          const hasContent = r.task || r.loc || r.cast || r.note;
          return (
            <div key={i} className="sched-card">
              <div className="sched-card-head">
                {r.time && <span className="sched-time">{r.time}</span>}
                {r.dur && <span className="sched-dur">{r.dur}</span>}
              </div>
              {r.task && <div className="sched-task">{r.task}</div>}
              {r.loc && <div className="sched-detail"><span className="sched-label">Location</span> {r.loc}</div>}
              {r.cast && <div className="sched-detail"><span className="sched-label">Cast</span> {r.cast}</div>}
              {r.note && <div className="sched-detail"><span className="sched-label">Note</span> {r.note}</div>}
              {!hasContent && <div className="sched-task sched-task--empty">—</div>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <table className="sched">
        <thead><tr>
          <th className="time">Time</th>
          <th className="task">Task</th>
          <th className="loc">Location</th>
          <th className="cast">Cast / Extras</th>
          <th className="note">Notes</th>
        </tr></thead>
        <tbody>
          {sec.data.map((r, i) => {
            const brk = hasBreak(i);
            if (r.type === 'span') {
              return (
                <tr key={i} className={`span${brk ? ' after-break-row' : ''}`}>
                  <td className="time">
                    <div className="row-controls">
                      <button onClick={() => handleRowAction(i, 'up')}>↑</button>
                      <button onClick={() => handleRowAction(i, 'down')}>↓</button>
                      <button onClick={() => handleRowAction(i, 'brk')} title="Page break before">⤓</button>
                      <button onClick={() => handleRowAction(i, 'del')}>×</button>
                    </div>
                    <span contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'time', e.currentTarget.textContent)} data-placeholder="00:00">{r.time}</span>
                    <span className="dur" contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'dur', e.currentTarget.textContent)} data-placeholder="dur">{r.dur}</span>
                  </td>
                  <td className="spanned" colSpan="4" contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'text', e.currentTarget.textContent)}><b>{r.text || ''}</b></td>
                </tr>
              );
            }
            return (
              <tr key={i} className={brk ? 'after-break-row' : ''}>
                <td className="time">
                  <div className="row-controls">
                    <button onClick={() => handleRowAction(i, 'up')}>↑</button>
                    <button onClick={() => handleRowAction(i, 'down')}>↓</button>
                    <button onClick={() => handleRowAction(i, 'brk')} title="Page break before">⤓</button>
                    <button onClick={() => handleRowAction(i, 'del')}>×</button>
                  </div>
                  <span contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'time', e.currentTarget.textContent)} data-placeholder="00:00">{r.time}</span>
                  <span className="dur" contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'dur', e.currentTarget.textContent)} data-placeholder="dur">{r.dur}</span>
                </td>
                <td className="task" contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'task', e.currentTarget.textContent)} data-placeholder="Task">{r.task}</td>
                <td className="loc" contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'loc', e.currentTarget.textContent)} data-placeholder="Location / address">{r.loc}</td>
                <td className="cast" contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'cast', e.currentTarget.textContent)} data-placeholder="Cast / extras">{r.cast}</td>
                <td className="note" contentEditable suppressContentEditableWarning onBlur={e => handleFieldChange(i, 'note', e.currentTarget.textContent)} data-placeholder="Notes">{r.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="add-row">
        <button onClick={addRow}>+ Add row</button>
        <button onClick={addSpan}>+ Add spanning row (travel / wrap)</button>
      </div>
    </>
  );
}