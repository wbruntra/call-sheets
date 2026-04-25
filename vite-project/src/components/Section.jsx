import { useCallback } from 'react';
import { useEditMode } from './EditModeContext';
import ScheduleSection from './ScheduleSection';
import ContactsSection from './ContactsSection';
import EquipmentSection from './EquipmentSection';
import KVSection from './KVSection';
import NotesSection from './NotesSection';

export default function Section({ sec, idx, updateDay, pageBreaks }) {
  const { editing } = useEditMode();

  const updateSection = useCallback((updater) => {
    if (!updateDay) return;
    updateDay(d => {
      const s = d.sections.find(s => s.id === sec.id);
      if (s) updater(s);
    });
  }, [updateDay, sec.id]);

  const handleTitleChange = useCallback((title) => {
    if (!updateDay) return;
    updateDay(d => {
      const s = d.sections.find(s => s.id === sec.id);
      if (s) s.title = title;
    });
  }, [updateDay, sec.id]);

  const handleAction = useCallback((act) => {
    if (!updateDay) return;
    updateDay(d => {
      const i = d.sections.findIndex(s => s.id === sec.id);
      if (i < 0) return;
      if (act === 'up' && i > 0) {
        const [s] = d.sections.splice(i, 1);
        d.sections.splice(i - 1, 0, s);
      }
      if (act === 'down' && i < d.sections.length - 1) {
        const [s] = d.sections.splice(i, 1);
        d.sections.splice(i + 1, 0, s);
      }
      if (act === 'del') {
        if (!confirm('Delete this section?')) return;
        d.sections.splice(i, 1);
        d.pageBreaks = (d.pageBreaks || []).filter(p => p.before !== sec.id);
      }
    });
  }, [updateDay, sec.id]);

  const nth = String(idx + 1).padStart(2, '0');
  const breakBefore = (pageBreaks || []).some(p => p.before === sec.id);

  return (
    <div className={`section section--${sec.type}${breakBefore ? ' after-break' : ''}`} data-id={sec.id}>
      <div className="section-head">
        <h3>
          <span className="num">{nth}</span>
          {editing ? (
            <span
              className="title"
              contentEditable
              suppressContentEditableWarning
              onBlur={e => handleTitleChange(e.currentTarget.textContent)}
              data-placeholder="Section title"
            >
              {sec.title}
            </span>
          ) : (
            <span className="title">{sec.title}</span>
          )}
        </h3>
        {editing && (
          <div className="sec-ctrls">
            <button data-sec-act="up" data-sec-id={sec.id} title="Move up" onClick={() => handleAction('up')}>↑</button>
            <button data-sec-act="down" data-sec-id={sec.id} title="Move down" onClick={() => handleAction('down')}>↓</button>
            <button data-sec-act="del" data-sec-id={sec.id} title="Delete section" onClick={() => handleAction('del')}>✕</button>
          </div>
        )}
      </div>
      <div className="section-body">
        {sec.type === 'schedule' && <ScheduleSection sec={sec} updateSection={updateSection} updateDay={updateDay} />}
        {sec.type === 'contacts' && <ContactsSection sec={sec} updateSection={updateSection} />}
        {sec.type === 'equipment' && <EquipmentSection sec={sec} updateSection={updateSection} />}
        {sec.type === 'hospital' && <KVSection sec={sec} updateSection={updateSection} fields={[['name','Name'],['addr','Address'],['phone','Phone'],['hours','Hours'],['dist','Dist.']]} />}
        {sec.type === 'basecamp' && <KVSection sec={sec} updateSection={updateSection} fields={[['name','Basecamp'],['addr','Address'],['parking','Parking'],['restroom','Restroom'],['catering','Catering']]} />}
        {sec.type === 'notes' && <NotesSection sec={sec} updateSection={updateSection} />}
      </div>
    </div>
  );
}