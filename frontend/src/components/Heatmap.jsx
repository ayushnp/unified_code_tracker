const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function heatColor(count) {
  if (count === 0) return "#161c24";
  if (count <= 2)  return "#0a3d20";
  if (count <= 5)  return "#0d6632";
  if (count <= 9)  return "#1a9e4a";
  return "#00ff88";
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

export default function Heatmap({ rawData, isTimestamp = false, activeDays, streakVal }) {
  const data = normalizeDaily(rawData || {}, isTimestamp);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end   = new Date(today);
  end.setDate(today.getDate() + (6 - today.getDay()));
  const start = new Date(end);
  start.setDate(end.getDate() - 52 * 7);
  start.setDate(start.getDate() - start.getDay());

  // Build weeks
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

  // Month labels
  const monthPos = [];
  let lastM = -1;
  weeks.forEach((w, wi) => {
    const first = w.find(d => !d.future);
    if (!first) return;
    const m = new Date(first.ds).getMonth();
    if (m !== lastM && wi > 0) { monthPos.push({ label: MONTHS[m], wi }); lastM = m; }
    else if (lastM === -1) lastM = m;
  });

  const total  = Object.values(data).reduce((a, b) => a + b, 0);
  const active = activeDays ?? Object.values(data).filter(v => v > 0).length;

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-meta">
        <strong>{total.toLocaleString()}</strong> submissions in the past year &nbsp;·&nbsp;
        Active days: <strong>{active}</strong>
        {streakVal ? <>&nbsp;·&nbsp; 🔥 Streak: <strong>{streakVal} days</strong></> : null}
      </div>

      <div className="heatmap-scroll">
        <div className="heatmap-inner">
          {/* month labels */}
          <div className="hm-month-row">
            {monthPos.map(({ label, wi }) => (
              <span key={label + wi} className="hm-month-lbl" style={{ left: wi * 15 }}>
                {label}
              </span>
            ))}
          </div>

          {/* grid */}
          <div className="hm-body">
            <div className="hm-day-labels">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((t, i) => (
                <div key={i} className="hm-day-lbl">{t}</div>
              ))}
            </div>

            <div className="hm-grid">
              {weeks.map((week, wi) => (
                <div key={wi} className="hm-week">
                  {week.map(({ ds, count, future }) => {
                    const label = new Date(ds + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    });
                    return (
                      <div
                        key={ds}
                        className="hm-cell"
                        style={{ background: future ? "transparent" : heatColor(count) }}
                      >
                        {!future && (
                          <div className="hm-tip">
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

          {/* legend */}
          <div className="hm-legend">
            Less
            {["#161c24","#0a3d20","#0d6632","#1a9e4a","#00ff88"].map(c => (
              <span key={c} className="hm-leg-cell" style={{ background: c }} />
            ))}
            More
          </div>
        </div>
      </div>
    </div>
  );
}