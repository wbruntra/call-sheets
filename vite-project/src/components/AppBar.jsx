export default function AppBar({
  store, currentDay, tab, setTab, editing, setEditing,
  switchDay, newDay, deleteDay, onImportJSON,
  onResetAll, onOpenTweaks, onOpenShare
}) {
  return (
    <div className="appbar">
      <div className="brand">
        Call Sheet
        <span className="sub">A4 · <span className="status">saved</span></span>
      </div>
      <div className="day-switcher">
        {store.days.map((d, i) => {
          const lbl = (d.meta?.date || '').trim() || `Day ${d.meta?.day || (i + 1)}`;
          const s = d.meta?.day ? `Day ${d.meta.day}` : '';
          return (
            <button
              key={d.id}
              className={`day-btn${d.id === store.currentDayId ? ' active' : ''}`}
              onClick={() => switchDay(d.id)}
            >
              <span className="day-btn-top">{lbl}</span>
              {s && s !== lbl && <span className="day-btn-sub">{s}</span>}
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
      <div className="tabs">
        <button data-tab="sheet" className={tab === 'sheet' ? 'active' : ''} onClick={() => setTab('sheet')}>Sheet</button>
        <button data-tab="intake" className={tab === 'intake' ? 'active' : ''} onClick={() => setTab('intake')}>Intake</button>
      </div>
      <div className="spacer" />
      <button onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
      <button onClick={deleteDay}>Delete Day</button>
      <button onClick={onImportJSON}>Import</button>
      <button onClick={onOpenShare}>Share</button>
      <button onClick={onOpenTweaks}>Tweaks</button>
      <button onClick={() => { if (confirm('Wipe ALL days and start fresh? (Cannot undo.)')) onResetAll(); }}>Reset All</button>
      <button className="primary" onClick={() => window.print()}>Print / PDF</button>
    </div>
  );
}