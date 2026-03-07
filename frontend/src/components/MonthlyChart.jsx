const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MonthlyChart({ monthly, yearlyTotal }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear  = new Date().getFullYear();
  const values       = Object.values(monthly);
  const maxVal       = Math.max(...values, 1);

  return (
    <div className="monthly-wrap">
      <div className="monthly-title">
        <strong>{yearlyTotal}</strong> submissions this year &nbsp;·&nbsp; Monthly breakdown
      </div>

      <div className="monthly-bars">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
          const key       = `${currentYear}-${String(m).padStart(2,"0")}`;
          const count     = monthly[key] || 0;
          const isCurrent = m === currentMonth;
          const isFuture  = m > currentMonth;
          const barHeight = count > 0 ? Math.max(8, (count / maxVal) * 90) : 4;
          const barColor  = isFuture ? "#21262d" : isCurrent ? "#2f8d46" : count > 0 ? "#196430" : "#21262d";

          return (
            <div key={m} className="month-col">
              <div className="month-count">{count > 0 ? count : ""}</div>
              <div className="bar-wrap">
                <div
                  className="month-bar"
                  title={`${MONTHS[m-1]}: ${count} submission${count !== 1 ? "s" : ""}`}
                  style={{ height: barHeight, background: barColor }}
                />
              </div>
              <div className={`month-lbl-b${isCurrent ? " cur" : ""}`}>{MONTHS[m-1]}</div>
            </div>
          );
        })}
      </div>

      <div className="monthly-legend">
        <span><span className="legend-dot" style={{ background: "#2f8d46" }} />Current month</span>
        <span><span className="legend-dot" style={{ background: "#196430" }} />Past months</span>
        <span><span className="legend-dot" style={{ background: "#21262d" }} />No activity</span>
      </div>
    </div>
  );
}