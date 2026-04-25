import { Fragment } from 'react';
import Field from './Field';

export default function KVSection({ sec, updateSection, fields }) {
  return (
    <div className="kv-grid">
      {fields.map(([key, label]) => (
        <Fragment key={key}>
          <div className="k">{label}</div>
          <Field
            tag="div"
            className="v"
            value={sec.data[key] || ''}
            onChange={v => updateSection(s => { s.data[key] = v; })}
            placeholder="—"
          />
        </Fragment>
      ))}
    </div>
  );
}