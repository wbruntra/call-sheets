import { useEditMode } from './EditModeContext';
import Field from './Field';

export default function NotesSection({ sec, updateSection }) {
  const { isMobile } = useEditMode();

  if (isMobile) {
    return (
      <div className="notes-mobile">{sec.data.text || ''}</div>
    );
  }

  return (
    <Field
      multiline
      className="notes-block"
      value={sec.data.text}
      onChange={v => updateSection(s => { s.data.text = v; })}
      placeholder="Notes…"
    />
  );
}