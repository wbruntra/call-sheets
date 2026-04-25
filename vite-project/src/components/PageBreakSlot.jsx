export default function PageBreakSlot({ hasBreak, onAdd, onRemove }) {
  if (hasBreak) {
    return (
      <div className="pbreak-slot is-break">
        <div className="pbreak-marker">
          <span>PAGE BREAK</span>
          <button className="pbreak-rm" onClick={onRemove}>✕ remove</button>
        </div>
      </div>
    );
  }
  return (
    <div className="pbreak-slot">
      <button className="pbreak-add" title="Insert page break" onClick={onAdd}>＋ insert page break</button>
    </div>
  );
}