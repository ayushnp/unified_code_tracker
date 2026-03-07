const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MonthlyChart({ monthly, yearlyTotal }) {
  const cm = new Date().getMonth() + 1;
  const cy = new Date().getFullYear();
  const vals = Object.values(monthly);
  const maxVal = Math.max(...vals, 1);

  return (
    <div className="monthly-chart">
      <div className="monthly-chart-title">
        <strong>{yearlyTotal}</strong> submissions this year &nbsp;·&nbsp; Monthly breakdown
      </div>

      <div className="monthly-bars-wrap">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
          const key    = `${cy}-${String(m).padStart(2, "0")}`;
          const count  = monthly[key] || 0;
          const isCur  = m === cm;
          const isFut  = m > cm;
          const h      = count > 0 ? Math.max(8, (count / maxVal) * 80) : 3;
          const color  = isFut ? "#161c24" : isCur ? "#8b5cf6" : count > 0 ? "#4c1d95" : "#161c24";

          return (
            <div key={m} className="month-col">
              <div className="month-count">{count > 0 ? count : ""}</div>
              <div className="bar-container">
                <div
                  className="month-bar"
                  style={{ height: h, background: color }}
                  title={`${MONTHS[m-1]}: ${count} submission${count !== 1 ? "s" : ""}`}
                />
              </div>
              <div className={`month-name${isCur ? " cur" : ""}`}>{MONTHS[m-1]}</div>
            </div>
          );
        })}
      </div>

      <div className="monthly-legend">
        <span><span className="leg-dot" style={{ background: "#8b5cf6" }} />Current</span>
        <span><span className="leg-dot" style={{ background: "#4c1d95" }} />Past</span>
        <span><span className="leg-dot" style={{ background: "#161c24" }} />None</span>
      </div>
    </div>
  );
}