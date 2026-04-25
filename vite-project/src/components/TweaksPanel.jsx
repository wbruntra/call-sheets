export default function TweaksPanel({ open, onClose, tweaks, setTweak, followedBin, onUnfollow }) {
  return (
    <div className={`tweaks${open ? ' open' : ''}`}>
      <h4>Tweaks <button className="close" onClick={onClose}>×</button></h4>
      <div className="row">
        <label>Japanese labels</label>
        <button
          className={`toggle${tweaks.showJP ? ' on' : ''}`}
          onClick={() => setTweak('showJP', !tweaks.showJP)}
          title="Show JP translations"
        />
      </div>
      <div className="row">
        <label>Logo slot</label>
        <button
          className={`toggle${tweaks.showLogo ? ' on' : ''}`}
          onClick={() => setTweak('showLogo', !tweaks.showLogo)}
          title="Show/hide logos"
        />
      </div>
      {followedBin && (
        <div className="tweaks-follow">
          <div className="tweaks-follow-label">Synced with cloud</div>
          <div className="tweaks-follow-id">{followedBin.binId.slice(0, 16)}…</div>
          <button className="tweaks-unfollow" onClick={onUnfollow}>Disconnect</button>
        </div>
      )}
    </div>
  );
}