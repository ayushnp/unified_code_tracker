const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function heatColor(count) {
  if (count === 0) return "#21262d";
  if (count <= 2)  return "#0e4429";
  if (count <= 5)  return "#006d32";
  if (count <= 9)  return "#26a641";
  return "#39d353";
}

function normalizeDaily(raw, isTimestamp) {
  const out = {};
  if (isTimestamp) {
    for (const [ts, count] of Object.entries(raw)) {
      const d = new Date(parseInt(ts) * 1000).toISOString().split("T")[0];
      out[d] = (out[d] || 0) + count;
    }
  } else {
    Object.assign(out, raw);
  }
  return out;
}

export default function Heatmap({ rawData, isTimestamp = false, totalSubs, activeDays, streakVal }) {
  const data = normalizeDaily(rawData || {}, isTimestamp);

  const today = new Date(); today.setHours(0,0,0,0);
  const end   = new Date(today);
  end.setDate(today.getDate() + (6 - today.getDay()));
  const start = new Date(end);
  start.setDate(end.getDate() - 52 * 7);
  start.setDate(start.getDate() - start.getDay());

  // Build weeks array
  const weeks = [];
  const cur = new Date(start);
  while (cur <= end) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const ds = cur.toISOString().split("T")[0];
      week.push({ ds, count: data[ds] || 0, future: cur > today });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month label positions
  const monthPos = [];
  let lastM = -1;
  weeks.forEach((w, wi) => {
    const first = w.find(d => !d.future);
    if (!first) return;
    const m = new Date(first.ds).getMonth();
    if (m !== lastM && wi > 0) { monthPos.push({ label: MONTHS[m], wi }); lastM = m; }
    else if (lastM === -1) lastM = m;
  });

  const total  = totalSubs  ?? Object.values(data).reduce((a,b) => a+b, 0);
  const active = activeDays ?? Object.values(data).filter(v => v > 0).length;

  return (
    <div className="heatmap-section">
      <div className="heatmap-info">
        <strong>{total.toLocaleString()}</strong> submissions in the past year &nbsp;·&nbsp;
        Active days: <strong>{active}</strong>
        {streakVal ? <>&nbsp;·&nbsp; Max streak: <strong>{streakVal}</strong></> : null}
      </div>

      <div className="heatmap-scroll">
        <div className="heatmap-graph">
          {/* Month labels */}
          <div className="month-labels-row" style={{ position: "relative", height: 17, marginLeft: 28, marginBottom: 4 }}>
            {monthPos.map(({ label, wi }) => (
              <span
                key={label + wi}
                className="month-lbl"
                style={{ position: "absolute", left: wi * 16 }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="heatmap-body">
            <div className="day-labels">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((t, i) => (
                <div key={i} className="day-lbl">{t}</div>
              ))}
            </div>

            <div className="weeks-grid">
              {weeks.map((week, wi) => (
                <div key={wi} className="week-col">
                  {week.map(({ ds, count, future }) => {
                    const label = new Date(ds + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    });
                    return (
                      <div
                        key={ds}
                        className="day-cell"
                        style={{ background: future ? "transparent" : heatColor(count) }}
                      >
                        {!future && (
                          <div className="day-tip">
                            {count > 0
                              ? `${count} submission${count > 1 ? "s" : ""} · ${label}`
                              : `No submissions · ${label}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="heatmap-legend">
            Less
            {["#21262d","#0e4429","#006d32","#26a641","#39d353"].map(c => (
              <span key={c} className="legend-cell" style={{ background: c }} />
            ))}
            More
          </div>
        </div>
      </div>
    </div>
  );
}