export default function StatBox({ label, value, colorClass, sub }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${colorClass}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}