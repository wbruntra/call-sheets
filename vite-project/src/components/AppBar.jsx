import { useState } from 'react';

export default function AppBar({
  store, currentDay, tab, setTab, editing, setEditing, isMobile,
  switchDay, newDay, deleteDay,
  onImportCSV, onImportJSON, onExportCSV,
  onResetAll, onOpenTweaks, onOpenShare
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const mobile = !!isMobile;

  return (
    <div className="appbar">
      <div className="brand">
        Call Sheet
        {!mobile && <span className="sub">A4 · <span className="status">saved</span></span>}
      </div>

      {/* Day switcher */}
      <div className="day-switcher">
        {store.days.map((d, i) => {
          const lbl = (d.meta?.date || '').trim() || (mobile ? `D${d.meta?.day || (i + 1)}` : `Day ${d.meta?.day || (i + 1)}`);
          const s = d.meta?.day ? `Day ${d.meta.day}` : '';
          return (
            <button
              key={d.id}
              className={`day-btn${d.id === store.currentDayId ? ' active' : ''}`}
              onClick={() => { switchDay(d.id); setMenuOpen(false); }}
            >
              <span className="day-btn-top">{lbl}</span>
              {!mobile && s && s !== lbl && <span className="day-btn-sub">{s}</span>}
            </button>
          );
        })}
        <button
          className="day-btn day-add"
          title="Add a new day"
          onClick={() => {
            const choice = prompt('New day:\n  1 = Blank day\n  2 = Duplicate current day (schedule cleared)\n  3 = Duplicate current day (full copy)', '2');
            if (!choice) return;
            if (choice === '1') newDay('blank');
            else if (choice === '2') newDay('duplicate');
            else if (choice === '3') newDay('copy');
          }}
        >
          +
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button data-tab="sheet" className={tab === 'sheet' ? 'active' : ''} onClick={() => setTab('sheet')}>Sheet</button>
        <button data-tab="intake" className={tab === 'intake' ? 'active' : ''} onClick={() => setTab('intake')}>Intake</button>
      </div>

      <div className="spacer" />

      {mobile ? (
        <>
          <button className="primary" onClick={() => window.print()}>Print</button>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
          {menuOpen && (
            <div className="appbar-menu">
              <button onClick={() => { if (!mobile) setEditing(!editing); else alert('Editing is disabled on mobile.'); setMenuOpen(false); }}>
                {editing ? 'Done' : 'Edit'}
              </button>
              <button onClick={() => { deleteDay(); setMenuOpen(false); }}>Delete Day</button>
              <button onClick={() => { onImportJSON(); setMenuOpen(false); }}>Import</button>
              <button onClick={() => { if (onImportCSV) onImportCSV(); setMenuOpen(false); }}>Import CSV</button>
              <button onClick={() => { onOpenShare(); setMenuOpen(false); }}>Share</button>
              <button onClick={() => { if (onExportCSV) onExportCSV(); setMenuOpen(false); }}>Export CSV</button>
              <button onClick={() => { onOpenTweaks(); setMenuOpen(false); }}>Tweaks</button>
              <button onClick={() => { if (confirm('Wipe ALL days and start fresh? (Cannot undo.)')) { onResetAll(); setMenuOpen(false); } }}>Reset All</button>
            </div>
          )}
        </>
      ) : (
        <>
          <button onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
          <button onClick={deleteDay}>Delete Day</button>
          {onImportJSON ? <button onClick={onImportJSON}>Import</button> : null}
          {onImportCSV ? <button onClick={onImportCSV}>Import CSV</button> : null}
          <button onClick={onOpenShare}>Share</button>
          {onExportCSV ? <button onClick={onExportCSV}>Export CSV</button> : null}
          <button onClick={onOpenTweaks}>Tweaks</button>
          <button onClick={() => { if (confirm('Wipe ALL days and start fresh? (Cannot undo.)')) onResetAll(); }}>Reset All</button>
          <button className="primary" onClick={() => window.print()}>Print / PDF</button>
        </>
      )}
    </div>
  );
}