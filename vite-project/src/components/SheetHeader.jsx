import { useCallback } from 'react';
import Field from './Field';

function LogoSlot({ logos, onUpdate }) {
  const handleUpload = useCallback((i) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        onUpdate(prev => {
          const next = [...prev];
          next[i] = { ...next[i], dataUrl: fr.result };
          return next;
        });
      };
      fr.readAsDataURL(f);
    };
    inp.click();
  }, [onUpdate]);

  const handleRemove = useCallback((i) => {
    if (!confirm('Remove this logo?')) return;
    onUpdate(prev => prev.filter((_, idx) => idx !== i));
  }, [onUpdate]);

  const handleLabelChange = useCallback((i, label) => {
    onUpdate(prev => {
      const next = [...prev];
      next[i] = { ...next[i], label };
      return next;
    });
  }, [onUpdate]);

  return (
    <div className="logo-slot-wrap">
      {logos.map((logo, i) => (
        <div key={i}>
          <div className="logo-item">
            {logo.dataUrl ? (
              <img src={logo.dataUrl} alt={logo.label} className="logo-img" />
            ) : (
              <button className="logo-upload" onClick={() => handleUpload(i)}>+ upload image</button>
            )}
            <div
              className="logo-label"
              contentEditable
              suppressContentEditableWarning
              onBlur={e => handleLabelChange(i, e.currentTarget.textContent)}
              data-placeholder="Label"
            >
              {logo.label}
            </div>
            <div className="logo-ctrls">
              <button onClick={() => handleUpload(i)} title="Replace image">⟳</button>
              <button onClick={() => handleRemove(i)} title="Remove">×</button>
            </div>
          </div>
          {i < logos.length - 1 && <div className="logo-rule" />}
        </div>
      ))}
      <button
        className="logo-add"
        onClick={() => onUpdate(prev => [...prev, { label: '', dataUrl: '' }])}
      >
        + Add logo
      </button>
    </div>
  );
}

export default function SheetHeader({ day, updateDay }) {
  const updateMeta = useCallback((key, value) => {
    updateDay(d => { d.meta[key] = value; });
  }, [updateDay]);

  const updateLogos = useCallback((updater) => {
    updateDay(d => { d.logos = typeof updater === 'function' ? updater(d.logos) : updater; });
  }, [updateDay]);

  return (
    <>
      <div className="hd">
        <div className="hd-company">
          <LogoSlot logos={day.logos} onUpdate={updateLogos} />
          <Field
            tag="div"
            className="name"
            value={day.meta.company}
            onChange={v => updateMeta('company', v)}
            html
          />
          <Field
            tag="div"
            className="addr"
            value={day.meta.address}
            onChange={v => updateMeta('address', v)}
            html
          />
          <div style={{ flex: 1 }} />
          <div className="hd-crew" id="headerCrew">
            <div><span className="role">Producer :</span><Field tag="span" value={day.meta['crew.lp']} onChange={v => updateMeta('crew.lp', v)} /></div>
            <div><span className="role">US Producer :</span><Field tag="span" value={day.meta['crew.usprod']} onChange={v => updateMeta('crew.usprod', v)} /></div>
            <div><span className="role">Director :</span><Field tag="span" value={day.meta['crew.director']} onChange={v => updateMeta('crew.director', v)} /></div>
            <div><span className="role">DOP :</span><Field tag="span" value={day.meta['crew.dop']} onChange={v => updateMeta('crew.dop', v)} /></div>
          </div>
        </div>

        <div className="hd-crew" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div className="lbl">Project <span className="jp">作品</span></div>
            <Field
              value={day.meta.project}
              onChange={v => updateMeta('project', v)}
              placeholder="Project"
              style={{ fontWeight: 700, marginTop: '3px', fontSize: '15px', letterSpacing: '-0.01em' }}
            />
          </div>
          <div>
            <div className="lbl">Client <span className="jp">クライアント</span></div>
            <Field
              value={day.meta.client}
              onChange={v => updateMeta('client', v)}
              placeholder="Client"
              style={{ marginTop: '2px', fontWeight: 500 }}
            />
          </div>
          <div>
            <div className="lbl">Location <span className="jp">ロケ地</span></div>
            <Field
              value={day.meta.mainLocation}
              onChange={v => updateMeta('mainLocation', v)}
              placeholder="Main location"
              style={{ marginTop: '2px' }}
            />
          </div>
        </div>

        <div className="hd-title">
          <div className="title-row">CALL SHEET<span className="jp jp-only">/ 香盤表</span></div>
          <div className="kv">
            <div className="k">Date</div>
            <Field
              tag="div"
              className="v"
              value={day.meta.date}
              onChange={v => updateMeta('date', v)}
              placeholder="YYYY.MM.DD (DAY)"
            />
          </div>
          <div className="kv">
            <div className="k">Day</div>
            <Field
              tag="div"
              className="v"
              value={day.meta.day}
              onChange={v => updateMeta('day', v)}
              placeholder="#"
            />
          </div>
          <div className="shoot-call">
            <span className="lbl">Shoot Call <span className="jp">撮影開始</span></span>
            <Field
              tag="span"
              className="time"
              value={day.meta.shootCall}
              onChange={v => updateMeta('shootCall', v)}
              placeholder="00:00"
            />
          </div>
        </div>
      </div>

      <div className="hd2">
        <div className="emergency">
          <div className="lbl">Emergency <span className="jp">緊急連絡</span></div>
          <Field
            tag="div"
            className="v"
            value={day.meta.emergency}
            onChange={v => updateMeta('emergency', v)}
            placeholder="Emergency contact"
          />
        </div>
        <div className="weather">
          <span className="lbl" style={{ color: 'var(--ink-3)', marginBottom: '2px' }}>Weather <span className="jp">天気</span></span>
          <Field
            tag="span"
            value={day.meta.weatherCallout}
            onChange={v => updateMeta('weatherCallout', v)}
            placeholder="Weather callout"
          />
        </div>
        <div className="sun">
          <span><span className="k">☀ Rise</span><Field tag="span" className="v" value={day.meta.sunrise} onChange={v => updateMeta('sunrise', v)} placeholder="—" /></span>
          <span><span className="k">☾ Set</span><Field tag="span" className="v" value={day.meta.sunset} onChange={v => updateMeta('sunset', v)} placeholder="—" /></span>
        </div>
      </div>
    </>
  );
}
