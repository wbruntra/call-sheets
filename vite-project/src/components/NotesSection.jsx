import Field from './Field';

export default function NotesSection({ sec, updateSection }) {
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
