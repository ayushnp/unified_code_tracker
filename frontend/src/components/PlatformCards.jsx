import Heatmap from "./Heatmap";
import MonthlyChart from "./MonthlyChart";

const META = {
  leetcode:      { color: "#f59e0b", bg: "rgba(245,158,11,.1)",  icon: "⚡", label: "LeetCode"      },
  codeforces:    { color: "#3b82f6", bg: "rgba(59,130,246,.1)",  icon: "🔵", label: "Codeforces"    },
  hackerrank:    { color: "#10b981", bg: "rgba(16,185,129,.1)",  icon: "🟢", label: "HackerRank"    },
  geeksforgeeks: { color: "#8b5cf6", bg: "rgba(139,92,246,.1)",  icon: "🟣", label: "GeeksForGeeks" },
};

function StatBox({ label, value, colorClass }) {
  return (
    <div className="stat-box">
      <div className="stat-box-label">{label}</div>
      <div className={`stat-box-val ${colorClass}`}>{value}</div>
    </div>
  );
}

function CardShell({ platform, username, children, loading, error }) {
  const m = META[platform];
  return (
    <div className="p-card">
      <div className="p-card-accent" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }} />
      <div className="p-card-header">
        <div className="p-card-icon" style={{ background: m.bg }}>
          {m.icon}
        </div>
        <div className="p-card-meta">
          <div className="p-card-name" style={{ color: m.color }}>{m.label}</div>
          <div className="p-card-user">@{username}</div>
        </div>
        <div
          className="p-card-live"
          style={{
            background: loading ? "rgba(74,95,114,.1)" : `${m.color}18`,
            color:       loading ? "var(--muted)" : m.color,
            border:      `1px solid ${loading ? "var(--border)" : m.color + "33"}`,
          }}
        >
          {loading ? "LOADING" : error ? "ERROR" : "LIVE"}
        </div>
      </div>

      {loading && (
        <div className="card-loading">
          <div className="card-spin" />
          Fetching data{platform === "geeksforgeeks" ? " (Selenium · ~8 sec)" : ""}…
        </div>
      )}
      {!loading && error && (
        <div className="card-error">⚠ {error}</div>
      )}
      {!loading && !error && children}
    </div>
  );
}

/* ── LeetCode ── */
export function LeetCodeCard({ username, data, loading, error }) {
  return (
    <CardShell platform="leetcode" username={username} loading={loading} error={error}>
      {data && (
        <>
          <div className="stats-row">
            <StatBox label="Total Solved" value={data.total_solved}      colorClass="c-total" />
            <StatBox label="Easy"         value={data.easy}              colorClass="c-easy" />
            <StatBox label="Medium"       value={data.medium}            colorClass="c-medium" />
            <StatBox label="Hard"         value={data.hard}              colorClass="c-hard" />
            <StatBox label="🔥 Streak"    value={`${data.streak}d`}      colorClass="c-streak" />
            <StatBox label="Active Days"  value={data.total_active_days} colorClass="c-white" />
          </div>
          {data.daily_submissions && (
            <Heatmap
              rawData={data.daily_submissions}
              isTimestamp={true}
              activeDays={data.total_active_days}
              streakVal={data.streak}
            />
          )}
        </>
      )}
    </CardShell>
  );
}

/* ── Codeforces ── */
export function CodeforcesCard({ username, data, loading, error }) {
  return (
    <CardShell platform="codeforces" username={username} loading={loading} error={error}>
      {data && (
        <>
          <div className="stats-row">
            <StatBox label="Solved" value={data.total_solved}                              colorClass="c-total" />
            <StatBox label="Rating" value={data.rating === "unrated" ? "—" : data.rating} colorClass="c-rating" />
            <StatBox label="Rank"   value={data.rank || "—"}                               colorClass="c-white" />
          </div>
          {data.daily_submissions && Object.keys(data.daily_submissions).length > 0 && (
            <Heatmap rawData={data.daily_submissions} isTimestamp={false} />
          )}
        </>
      )}
    </CardShell>
  );
}

/* ── HackerRank ── */
export function HackerRankCard({ username, data, loading, error }) {
  return (
    <CardShell platform="hackerrank" username={username} loading={loading} error={error}>
      {data && (
        <>
          <div className="stats-row">
            <StatBox label="Total Score"   value={Math.round(data.total_score)} colorClass="c-hr" />
            <StatBox label="Active Tracks" value={data.active_tracks}           colorClass="c-white" />
          </div>
          {data.breakdown?.length > 0 && (
            <>
              <div className="tracks-title">Track Breakdown</div>
              <div className="tracks-grid">
                {data.breakdown.map(t => (
                  <div key={t.name} className="track-pill">
                    <div className="track-name">{t.name}</div>
                    <div className="track-score">{Math.round(t.score)} pts</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </CardShell>
  );
}

/* ── GeeksForGeeks ── */
export function GFGCard({ username, data, loading, error }) {
  return (
    <CardShell platform="geeksforgeeks" username={username} loading={loading} error={error}>
      {data && (
        <>
          <div className="stats-row">
            <StatBox label="Total Solved"   value={data.total_solved}           colorClass="c-total" />
            <StatBox label="Coding Score"   value={data.coding_score}           colorClass="c-rating" />
            <StatBox label="Easy"           value={data.easy}                   colorClass="c-easy" />
            <StatBox label="Medium"         value={data.medium}                 colorClass="c-medium" />
            <StatBox label="Hard"           value={data.hard}                   colorClass="c-hard" />
            <StatBox label="Basic"          value={data.basic}                  colorClass="c-white" />
            <StatBox label="School"         value={data.school}                 colorClass="c-white" />
            <StatBox label="🔥 POTD Streak" value={`${data.potd_streak}d`}     colorClass="c-streak" />
            <StatBox label="Longest Streak" value={`${data.longest_streak}d`}  colorClass="c-streak" />
            <StatBox label="POTDs Solved"   value={data.potds_solved}           colorClass="c-white" />
            <StatBox label="Institute Rank" value={data.institute_rank}         colorClass="c-rating" />
          </div>

          {data.monthly_submissions && Object.keys(data.monthly_submissions).length > 0 && (
            <MonthlyChart monthly={data.monthly_submissions} yearlyTotal={data.yearly_submissions} />
          )}

          <div className="gfg-note">
            ⏱ GFG uses Selenium headless browser — takes ~5–8 seconds to load. That's expected.
          </div>
        </>
      )}
    </CardShell>
  );
}