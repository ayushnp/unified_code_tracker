import { useState } from "react";
import api from "../utils/api";

const PLATFORMS = [
  { key: "leetcode",      label: "LeetCode",      short: "LC",  color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  { key: "codeforces",    label: "Codeforces",    short: "CF",  color: "#3b82f6", bg: "rgba(59,130,246,.12)" },
  { key: "hackerrank",    label: "HackerRank",    short: "HR",  color: "#10b981", bg: "rgba(16,185,129,.12)" },
  { key: "geeksforgeeks", label: "GeeksForGeeks", short: "GFG", color: "#8b5cf6", bg: "rgba(139,92,246,.12)" },
];

// Metrics to compare per platform
const METRICS = {
  leetcode:      [
    { key: "total_solved", label: "Total Solved",  higher: true },
    { key: "easy",         label: "Easy",          higher: true },
    { key: "medium",       label: "Medium",        higher: true },
    { key: "hard",         label: "Hard",          higher: true },
    { key: "streak",       label: "Streak (days)", higher: true },
    { key: "total_active_days", label: "Active Days", higher: true },
  ],
  codeforces: [
    { key: "total_solved", label: "Total Solved",  higher: true },
    { key: "rating",       label: "Rating",        higher: true },
  ],
  hackerrank: [
    { key: "total_score",   label: "Total Score",   higher: true },
    { key: "active_tracks", label: "Active Tracks", higher: true },
  ],
  geeksforgeeks: [
    { key: "total_solved",  label: "Total Solved",   higher: true },
    { key: "coding_score",  label: "Coding Score",   higher: true },
    { key: "potd_streak",   label: "POTD Streak",    higher: true },
    { key: "longest_streak",label: "Longest Streak", higher: true },
    { key: "potds_solved",  label: "POTDs Solved",   higher: true },
  ],
};

function Spinner() {
  return <span className="spin" style={{ borderTopColor: "#000" }} />;
}

function CompareBar({ myVal, friendVal, higher, color }) {
  const a = parseFloat(myVal)    || 0;
  const b = parseFloat(friendVal) || 0;
  const total = a + b;
  if (total === 0) return <div className="cmp-bar-empty">No data</div>;

  const myPct     = Math.round((a / total) * 100);
  const friendPct = 100 - myPct;
  const myWins    = higher ? a >= b : a <= b;
  const friendWins= higher ? b >= a : b <= a;

  return (
    <div className="cmp-bar-wrap">
      <span className={`cmp-val cmp-val-left ${myWins && a !== b ? "cmp-winner" : ""}`}>{a.toLocaleString()}</span>
      <div className="cmp-bar-track">
        <div
          className="cmp-bar-left"
          style={{ width: `${myPct}%`, background: myWins && a !== b ? "var(--glow)" : "var(--dim)" }}
        />
        <div
          className="cmp-bar-right"
          style={{ width: `${friendPct}%`, background: friendWins && a !== b ? color : "var(--dim)" }}
        />
      </div>
      <span className={`cmp-val cmp-val-right ${friendWins && a !== b ? "cmp-winner" : ""}`}>{b.toLocaleString()}</span>
    </div>
  );
}

function PlatformCompareCard({ platform, myData, friendData, myUsername, friendUsername }) {
  const meta    = PLATFORMS.find(p => p.key === platform);
  const metrics = METRICS[platform] || [];

  const myErr     = myData?.error;
  const friendErr = friendData?.error;

  // Count wins
  let myWins = 0, friendWins = 0;
  metrics.forEach(({ key, higher }) => {
    const a = parseFloat(myData?.[key])     || 0;
    const b = parseFloat(friendData?.[key]) || 0;
    if (a === b) return;
    if (higher ? a > b : a < b) myWins++;
    else friendWins++;
  });

  return (
    <div className="cmp-card">
      {/* accent bar */}
      <div className="p-card-accent" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

      {/* header */}
      <div className="cmp-card-header">
        <div className="p-card-icon" style={{ background: meta.bg, fontSize: "1rem", width: 34, height: 34 }}>
          {["⚡","🔵","🟢","🟣"][PLATFORMS.indexOf(meta)]}
        </div>
        <div className="p-card-name" style={{ color: meta.color }}>{meta.label}</div>
        {!myErr && !friendErr && myWins + friendWins > 0 && (
          <div className="cmp-wins-badge">
            <span style={{ color: "var(--glow)" }}>You {myWins}W</span>
            <span style={{ color: "var(--muted)" }}>·</span>
            <span style={{ color: meta.color }}>Friend {friendWins}W</span>
          </div>
        )}
      </div>

      {/* usernames row */}
      <div className="cmp-usernames">
        <span className="cmp-username-tag cmp-mine">@{myUsername || "—"}</span>
        <span className="cmp-vs">VS</span>
        <span className="cmp-username-tag" style={{ borderColor: meta.color + "44", color: meta.color }}>
          @{friendUsername || "—"}
        </span>
      </div>

      {/* errors */}
      {(myErr || friendErr) && (
        <div className="card-error" style={{ marginTop: ".5rem" }}>
          {myErr && <div>You: ⚠ {myErr}</div>}
          {friendErr && <div>Friend: ⚠ {friendErr}</div>}
        </div>
      )}

      {/* metric rows */}
      {!myErr && !friendErr && (
        <div className="cmp-metrics">
          {metrics.map(({ key, label, higher }) => (
            <div key={key} className="cmp-metric-row">
              <div className="cmp-metric-label">{label}</div>
              <CompareBar
                myVal={myData?.[key]}
                friendVal={friendData?.[key]}
                higher={higher}
                color={meta.color}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComparePage({ token, myPlatforms, myEmail, onBack }) {
  const [friend,   setFriend]   = useState({ leetcode: "", codeforces: "", hackerrank: "", geeksforgeeks: "" });
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const sharedPlatforms = PLATFORMS.filter(p =>
    (myPlatforms[p.key]?.trim()) || (friend[p.key]?.trim())
  );

  const handleCompare = async () => {
    setError("");
    if (!Object.values(friend).some(v => v.trim())) {
      setError("Enter at least one friend username to compare.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post("/compare", friend, token);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Overall score: count total wins
  const getOverallScore = () => {
    if (!result) return null;
    let myTotal = 0, friendTotal = 0;
    PLATFORMS.forEach(({ key }) => {
      const metrics = METRICS[key] || [];
      const myData  = result.me.stats[key];
      const frData  = result.friend.stats[key];
      if (!myData || !frData || myData.error || frData.error) return;
      metrics.forEach(({ key: mk, higher }) => {
        const a = parseFloat(myData[mk]) || 0;
        const b = parseFloat(frData[mk]) || 0;
        if (a === b) return;
        if (higher ? a > b : a < b) myTotal++;
        else friendTotal++;
      });
    });
    return { myTotal, friendTotal };
  };

  const score = getOverallScore();

  return (
    <div className="dashboard">
      {/* Top bar */}
      <div className="dash-top">
        <div>
          <div className="dash-greeting">// HEAD TO HEAD COMPARISON</div>
          <div className="dash-title">Compare <span>Stats</span> ⚔️</div>
        </div>
        <button className="dash-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Input form */}
      <div className="cmp-setup-card">
        <div className="cmp-setup-header">
          <div className="cmp-setup-title">Enter Friend's Usernames</div>
          <div className="cmp-setup-sub">Leave blank any platforms you don't want to compare</div>
        </div>

        <div className="cmp-setup-grid">
          {PLATFORMS.map(p => (
            <div className="field" key={p.key}>
              <label className="field-label">{p.label}</label>
              <div className="field-with-badge">
                <span className="field-badge" style={{ background: p.bg, color: p.color }}>{p.short}</span>
                <input
                  className="field-input"
                  type="text"
                  placeholder={myPlatforms[p.key] ? `your: ${myPlatforms[p.key]}` : `friend's username`}
                  value={friend[p.key]}
                  onChange={e => setFriend(prev => ({ ...prev, [p.key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleCompare()}
                />
              </div>
            </div>
          ))}
        </div>

        {error && <div className="alert err" style={{ marginTop: "1rem" }}><span>✗</span><span>{error}</span></div>}

        <button
          className="btn btn-primary"
          style={{ marginTop: "1.25rem" }}
          onClick={handleCompare}
          disabled={loading}
        >
          {loading ? <><Spinner /> Fetching friend's stats…</> : "⚔️ Compare Now"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Overall scoreboard */}
          {score && (
            <div className="cmp-scoreboard">
              <div className={`cmp-score-side ${score.myTotal > score.friendTotal ? "cmp-score-win" : ""}`}>
                <div className="cmp-score-name">@{myEmail?.split("@")[0]}</div>
                <div className="cmp-score-num">{score.myTotal}</div>
                <div className="cmp-score-label">wins</div>
              </div>
              <div className="cmp-score-center">
                <div className="cmp-score-vs">⚔️</div>
                <div className="cmp-score-total">{score.myTotal + score.friendTotal} metrics</div>
              </div>
              <div className={`cmp-score-side ${score.friendTotal > score.myTotal ? "cmp-score-win" : ""}`}>
                <div className="cmp-score-name">Friend</div>
                <div className="cmp-score-num">{score.friendTotal}</div>
                <div className="cmp-score-label">wins</div>
              </div>
            </div>
          )}

          {/* Per-platform cards */}
          {PLATFORMS.map(({ key }) => {
            const myHas     = result.me.stats[key];
            const friendHas = result.friend.stats[key];
            if (!myHas && !friendHas) return null;
            return (
              <PlatformCompareCard
                key={key}
                platform={key}
                myData={result.me.stats[key]}
                friendData={result.friend.stats[key]}
                myUsername={result.me.usernames[key]}
                friendUsername={result.friend.usernames[key]}
              />
            );
          })}
        </>
      )}
    </div>
  );
}