import Heatmap from "./Heatmap";
import MonthlyChart from "./MonthlyChart";
import StatBox from "./StatBox";
import { Spinner } from "./UI";

const PLATFORM_META = {
  leetcode:      { color: "#f59e0b", icon: "🟡", label: "LeetCode"      },
  codeforces:    { color: "#3b82f6", icon: "🔵", label: "Codeforces"    },
  hackerrank:    { color: "#22c55e", icon: "🟢", label: "HackerRank"    },
  geeksforgeeks: { color: "#2f8d46", icon: "🟩", label: "GeeksForGeeks" },
};

// ── Card wrapper ──────────────────────────────────────────────
function PlatformCard({ platform, username, children }) {
  const meta = PLATFORM_META[platform];
  return (
    <div className="platform-card">
      <div className="platform-header">
        <div className="platform-dot" style={{ background: meta.color }} />
        <div className="platform-name">{meta.icon} {meta.label}</div>
        <div className="platform-user">@{username}</div>
        <div
          className="platform-badge"
          style={{
            background: meta.color + "22",
            color: meta.color,
            border: `1px solid ${meta.color}44`,
          }}
        >
          LIVE
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Loading state card ────────────────────────────────────────
export function LoadingCard({ platform, username }) {
  const isGfg = platform === "geeksforgeeks";
  return (
    <PlatformCard platform={platform} username={username}>
      <div className="loading-row">
        <Spinner dark />
        Fetching data{isGfg ? " (Selenium — ~8 sec)" : ""}…
      </div>
    </PlatformCard>
  );
}

// ── Error state card ──────────────────────────────────────────
export function ErrorCard({ platform, username, message }) {
  return (
    <PlatformCard platform={platform} username={username}>
      <div className="error-row">⚠ Could not load — {message}</div>
    </PlatformCard>
  );
}

// ── LeetCode ──────────────────────────────────────────────────
export function LeetcodeCard({ username, data }) {
  return (
    <PlatformCard platform="leetcode" username={username}>
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
          totalSubs={Object.values(data.daily_submissions).reduce((a,b)=>a+b,0)}
          activeDays={data.total_active_days}
          streakVal={data.streak}
        />
      )}
    </PlatformCard>
  );
}

// ── Codeforces ────────────────────────────────────────────────
export function CodeforcesCard({ username, data }) {
  return (
    <PlatformCard platform="codeforces" username={username}>
      <div className="stats-row">
        <StatBox label="Total Solved" value={data.total_solved}                              colorClass="c-total" />
        <StatBox label="Rating"       value={data.rating === "unrated" ? "—" : data.rating} colorClass="c-rating" />
        <StatBox label="Rank"         value={data.rank || "—"}                               colorClass="c-white" />
      </div>
      {data.daily_submissions && Object.keys(data.daily_submissions).length > 0 && (
        <Heatmap rawData={data.daily_submissions} isTimestamp={false} />
      )}
    </PlatformCard>
  );
}

// ── HackerRank ────────────────────────────────────────────────
export function HackerrankCard({ username, data }) {
  return (
    <PlatformCard platform="hackerrank" username={username}>
      <div className="stats-row">
        <StatBox label="Total Score"   value={data.total_score}   colorClass="c-total" />
        <StatBox label="Active Tracks" value={data.active_tracks} colorClass="c-white" />
      </div>
      {data.breakdown && data.breakdown.length > 0 && (
        <>
          <div className="tracks-label">Track Breakdown</div>
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
    </PlatformCard>
  );
}

// ── GeeksForGeeks ─────────────────────────────────────────────
export function GeeksforgeeksCard({ username, data }) {
  return (
    <PlatformCard platform="geeksforgeeks" username={username}>
      <div className="stats-row">
        <StatBox label="Total Solved"   value={data.total_solved}         colorClass="c-total" />
        <StatBox label="Coding Score"   value={data.coding_score}         colorClass="c-gfg" />
        <StatBox label="Easy"           value={data.easy}                 colorClass="c-easy" />
        <StatBox label="Medium"         value={data.medium}               colorClass="c-medium" />
        <StatBox label="Hard"           value={data.hard}                 colorClass="c-hard" />
        <StatBox label="Basic"          value={data.basic}                colorClass="c-white" />
        <StatBox label="School"         value={data.school}               colorClass="c-white" />
        <StatBox label="🔥 POTD Streak" value={`${data.potd_streak}d`}   colorClass="c-streak" />
        <StatBox label="Longest Streak" value={`${data.longest_streak}d`} colorClass="c-streak" />
        <StatBox label="POTDs Solved"   value={data.potds_solved}         colorClass="c-white" />
        <StatBox label="Institute Rank" value={data.institute_rank}       colorClass="c-rating" />
      </div>

      {data.monthly_submissions && Object.keys(data.monthly_submissions).length > 0 && (
        <MonthlyChart monthly={data.monthly_submissions} yearlyTotal={data.yearly_submissions} />
      )}

      <div className="gfg-note">
        ⏱ GFG loads via Selenium — takes ~5–8 seconds. That's normal!
      </div>
    </PlatformCard>
  );
}