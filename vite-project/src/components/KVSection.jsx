import { Fragment } from 'react';
import { useEditMode } from './EditModeContext';
import Field from './Field';

export default function KVSection({ sec, updateSection, fields }) {
  const { isMobile } = useEditMode();

  return (
    <div className={`kv-grid${isMobile ? ' kv-mobile' : ''}`}>
      {fields.map(([key, label]) => (
        <Fragment key={key}>
          <div className="k">{label}</div>
          {isMobile ? (
            <div className="v">{sec.data[key] || '—'}</div>
          ) : (
            <Field
              tag="div"
              className="v"
              value={sec.data[key] || ''}
              onChange={v => updateSection(s => { s.data[key] = v; })}
              placeholder="—"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}