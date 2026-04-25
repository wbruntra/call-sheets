import { useCallback } from 'react';
import { uid } from '../utils';
import { useEditMode } from './EditModeContext';
import SheetHeader from './SheetHeader';
import Section from './Section';
import PageBreakSlot from './PageBreakSlot';

const SECTION_TYPES = [
  { type: 'schedule', label: '+ Schedule' },
  { type: 'contacts', label: '+ Contacts' },
  { type: 'equipment', label: '+ Equipment' },
  { type: 'hospital', label: '+ Hospital' },
  { type: 'basecamp', label: '+ Parking / Basecamp' },
  { type: 'notes', label: '+ Notes' },
];

export default function Sheet({ day, updateDay, store }) {
  const editing = useEditMode();

  const addSection = useCallback((type) => {
    const blank = { id: uid(), type, title: type[0].toUpperCase() + type.slice(1) };
    if (type === 'schedule') blank.data = [];
    if (type === 'contacts') blank.data = [];
    if (type === 'equipment') blank.data = [];
    if (type === 'hospital') blank.data = { name: '', addr: '', phone: '', hours: '', dist: '' };
    if (type === 'basecamp') blank.data = { name: '', addr: '', parking: '', restroom: '', catering: '' };
    if (type === 'notes') blank.data = { text: '' };
    updateDay(d => { d.sections.push(blank); });
  }, [updateDay]);

  const toggleBreak = useCallback((beforeId) => {
    updateDay(d => {
      const idx = (d.pageBreaks || []).findIndex(p => p.before === beforeId);
      if (idx >= 0) d.pageBreaks.splice(idx, 1);
      else (d.pageBreaks = d.pageBreaks || []).push({ before: beforeId });
    });
  }, [updateDay]);

  const removeBreakByIndex = useCallback((idx) => {
    updateDay(d => { d.pageBreaks.splice(idx, 1); });
  }, [updateDay]);

  const sections = day.sections || [];
  const pageBreaks = day.pageBreaks || [];

  return (
    <div className="page-wrap">
      <div className="paper" id="paper">
        <SheetHeader day={day} updateDay={updateDay} />

        {editing && sections.length > 0 && (
          <PageBreakSlot
            hasBreak={pageBreaks.some(p => p.before === sections[0]?.id)}
            onAdd={() => toggleBreak(sections[0]?.id || '__end__')}
            onRemove={() => {
              const bi = pageBreaks.findIndex(p => p.before === sections[0]?.id);
              if (bi >= 0) removeBreakByIndex(bi);
            }}
          />
        )}

        {sections.map((sec, idx) => {
          const nextId = sections[idx + 1]?.id || '__end__';
          return (
            <Section key={sec.id} sec={sec} idx={idx} updateDay={updateDay} pageBreaks={pageBreaks} />
          );
        })}

        {editing && sections.map((sec, idx) => {
          const nextId = sections[idx]?.id;
          if (!nextId) return null;
          const afterCurrent = sections[idx + 1]?.id || '__end__';
          const hasBreak = pageBreaks.some(p => p.before === afterCurrent);
          return (
            <PageBreakSlot
              key={`pb-after-${sec.id}`}
              hasBreak={hasBreak}
              onAdd={() => toggleBreak(afterCurrent)}
              onRemove={() => {
                const bi = pageBreaks.findIndex(p => p.before === afterCurrent);
                if (bi >= 0) removeBreakByIndex(bi);
              }}
            />
          );
        })}

        {editing && (
          <div className="add-sec">
            <div className="add-sec-title">Add section</div>
            <div className="add-sec-buttons">
              {SECTION_TYPES.map(({ type, label }) => (
                <button key={type} onClick={() => addSection(type)}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}