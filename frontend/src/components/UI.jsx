// ─── Spinner ────────────────────────────────────────────────
export function Spinner() {
  return <span className="ct-spin" />;
}

// ─── Alert ──────────────────────────────────────────────────
// type: "err" | "ok"
export function Alert({ type, msg }) {
  if (!msg) return null;
  return (
    <div className={`ct-alert ${type}`}>
      <span>{type === "err" ? "⚠" : "✓"}</span>
      <span>{msg}</span>
    </div>
  );
}

// ─── Progress bar (3 steps) ─────────────────────────────────
// stepIndex: 0 = auth, 1 = platforms, 2 = dashboard
export function Progress({ stepIndex }) {
  return (
    <div className="ct-progress">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`ct-prog-seg ${
            i < stepIndex ? "done" : i === stepIndex ? "active" : ""
          }`}
        />
      ))}
    </div>
  );
}

// ─── Platform badge + text input ────────────────────────────
export function PlatformInput({ label, short, color, bg, value, onChange, placeholder }) {
  return (
    <div className="ct-field">
      <label className="ct-label">{label}</label>
      <div className="ct-pfield">
        <span className="ct-pbadge" style={{ background: bg, color }}>
          {short}
        </span>
        <input
          className="ct-input"
          type="text"
          placeholder={placeholder || `your ${label} username`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}