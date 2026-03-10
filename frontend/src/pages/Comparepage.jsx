import { useState } from "react";
import api from "../utils/api";

const PLATFORMS = [
  { key: "leetcode",      label: "LeetCode",      short: "LC",  color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  { key: "codeforces",    label: "Codeforces",    short: "CF",  color: "#3b82f6", bg: "rgba(59,130,246,.12)" },
  { key: "hackerrank",    label: "HackerRank",    short: "HR",  color: "#10b981", bg: "rgba(16,185,129,.12)" },
  { key: "geeksforgeeks", label: "GeeksForGeeks", short: "GFG", color: "#8b5cf6", bg: "rgba(139,92,246,.12)" },
];

const METRICS = {
  leetcode: [
    { key: "total_solved",      label: "Total Solved",  higher: true },
    { key: "easy",              label: "Easy",          higher: true },
    { key: "medium",            label: "Medium",        higher: true },
    { key: "hard",              label: "Hard",          higher: true },
    { key: "streak",            label: "Streak (days)", higher: true },
    { key: "total_active_days", label: "Active Days",   higher: true },
  ],
  codeforces: [
    { key: "total_solved", label: "Total Solved", higher: true },
    { key: "rating",       label: "Rating",       higher: true },
  ],
  hackerrank: [
    { key: "total_score",   label: "Total Score",   higher: true },
    { key: "active_tracks", label: "Active Tracks", higher: true },
  ],
  geeksforgeeks: [
    { key: "total_solved",   label: "Total Solved",   higher: true },
    { key: "coding_score",   label: "Coding Score",   higher: true },
    { key: "potd_streak",    label: "POTD Streak",    higher: true },
    { key: "longest_streak", label: "Longest Streak", higher: true },
    { key: "potds_solved",   label: "POTDs Solved",   higher: true },
  ],
};

function Spinner() {
  return <span className="spin" style={{ borderTopColor: "#000" }} />;
}

// Each metric row: YOU [bar] FRIEND with both values always visible
function MetricRow({ label, myVal, friendVal, higher, platformColor }) {
  const a = parseFloat(myVal)     || 0;
  const b = parseFloat(friendVal) || 0;
  const max = Math.max(a, b, 1);

  // Use percentage of max, with a minimum 4% so bars are always visible
  const myPct     = Math.max((a / max) * 100, a > 0 ? 4 : 0);
  const friendPct = Math.max((b / max) * 100, b > 0 ? 4 : 0);

  const myWins     = higher ? a > b : a < b;
  const friendWins = higher ? b > a : b < a;
  const tied       = a === b;

  return (
    <div className="cmp-metric-row2">
      {/* Label */}
      <div className="cmp-metric-label2">{label}</div>

      {/* YOU side */}
      <div className="cmp-side cmp-side-left">
        <span className={`cmp-side-val ${myWins ? "cmp-winner-val" : tied ? "cmp-tied-val" : "cmp-loser-val"}`}>
          {a.toLocaleString()}
          {myWins && <span className="cmp-crown">👑</span>}
        </span>
        <div className="cmp-bar-outer cmp-bar-outer-left">
          <div
            className="cmp-bar-fill cmp-bar-fill-left"
            style={{
              width: `${myPct}%`,
              background: myWins ? "var(--glow)" : tied ? "var(--muted)" : "var(--dim)",
              boxShadow: myWins ? "0 0 8px rgba(0,255,136,.4)" : "none",
            }}
          />
        </div>
      </div>

      {/* Center divider */}
      <div className="cmp-center-divider" />

      {/* FRIEND side */}
      <div className="cmp-side cmp-side-right">
        <div className="cmp-bar-outer cmp-bar-outer-right">
          <div
            className="cmp-bar-fill cmp-bar-fill-right"
            style={{
              width: `${friendPct}%`,
              background: friendWins ? platformColor : tied ? "var(--muted)" : "var(--dim)",
              boxShadow: friendWins ? `0 0 8px ${platformColor}66` : "none",
            }}
          />
        </div>
        <span className={`cmp-side-val ${friendWins ? "cmp-winner-val" : tied ? "cmp-tied-val" : "cmp-loser-val"}`}
          style={{ color: friendWins ? platformColor : undefined }}
        >
          {friendWins && <span className="cmp-crown">👑</span>}
          {b.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function PlatformCompareCard({ platform, myData, friendData, myUsername, friendUsername }) {
  const meta    = PLATFORMS.find(p => p.key === platform);
  const metrics = METRICS[platform] || [];
  const icons   = ["⚡", "🔵", "🟢", "🟣"];
  const icon    = icons[PLATFORMS.indexOf(meta)];

  const myErr     = myData?.error;
  const friendErr = friendData?.error;

  let myWins = 0, friendWins = 0, ties = 0;
  metrics.forEach(({ key, higher }) => {
    const a = parseFloat(myData?.[key])    || 0;
    const b = parseFloat(friendData?.[key]) || 0;
    if (a === b) { ties++; return; }
    if (higher ? a > b : a < b) myWins++;
    else friendWins++;
  });

  return (
    <div className="cmp-card">
      <div className="p-card-accent" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

      {/* Header */}
      <div className="cmp-card-header">
        <div className="p-card-icon" style={{ background: meta.bg, fontSize: "1rem", width: 34, height: 34 }}>
          {icon}
        </div>
        <div className="p-card-name" style={{ color: meta.color }}>{meta.label}</div>
        {!myErr && !friendErr && (
          <div className="cmp-wins-badge">
            <span style={{ color: "var(--glow)" }}>You {myWins}W</span>
            <span style={{ color: "var(--muted)" }}>·</span>
            <span style={{ color: meta.color }}>Friend {friendWins}W</span>
            {ties > 0 && <><span style={{ color: "var(--muted)" }}>·</span><span style={{ color: "var(--muted)" }}>{ties} tied</span></>}
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="cmp-col-headers">
        <div className="cmp-col-you">
          <span className="cmp-col-badge cmp-col-badge-you">YOU</span>
          <span className="cmp-col-username">@{myUsername || "—"}</span>
        </div>
        <div className="cmp-col-mid" />
        <div className="cmp-col-friend">
          <span className="cmp-col-badge" style={{ borderColor: meta.color + "55", color: meta.color }}>FRIEND</span>
          <span className="cmp-col-username">@{friendUsername || "—"}</span>
        </div>
      </div>

      {/* Errors */}
      {(myErr || friendErr) && (
        <div className="card-error" style={{ marginTop: ".5rem" }}>
          {myErr     && <div>You: ⚠ {myErr}</div>}
          {friendErr && <div>Friend: ⚠ {friendErr}</div>}
        </div>
      )}

      {/* Metrics */}
      {!myErr && !friendErr && (
        <div className="cmp-metrics2">
          {metrics.map(({ key, label, higher }) => (
            <MetricRow
              key={key}
              label={label}
              myVal={myData?.[key]}
              friendVal={friendData?.[key]}
              higher={higher}
              platformColor={meta.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComparePage({ token, myPlatforms, myEmail, onBack }) {
  const [friend,  setFriend]  = useState({ leetcode: "", codeforces: "", hackerrank: "", geeksforgeeks: "" });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

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

  // Overall scoreboard
  const getScore = () => {
    if (!result) return null;
    let myTotal = 0, friendTotal = 0, tiedTotal = 0;
    PLATFORMS.forEach(({ key }) => {
      const metrics = METRICS[key] || [];
      const myData  = result.me.stats[key];
      const frData  = result.friend.stats[key];
      if (!myData || !frData || myData.error || frData.error) return;
      metrics.forEach(({ key: mk, higher }) => {
        const a = parseFloat(myData[mk]) || 0;
        const b = parseFloat(frData[mk]) || 0;
        if (a === b) { tiedTotal++; return; }
        if (higher ? a > b : a < b) myTotal++;
        else friendTotal++;
      });
    });
    return { myTotal, friendTotal, tiedTotal };
  };

  const score       = getScore();
  const myName      = myEmail?.split("@")[0] ?? "you";
  const iWin        = score && score.myTotal > score.friendTotal;
  const friendWins  = score && score.friendTotal > score.myTotal;
  const tied        = score && score.myTotal === score.friendTotal;

  return (
    <div className="dashboard">
      {/* Top bar */}
      <div className="dash-top">
        <div>
          <div className="dash-greeting">// HEAD TO HEAD COMPARISON</div>
          <div className="dash-title">Compare <span>Stats</span> ⚔️</div>
        </div>
        <button className="dash-btn" onClick={onBack}>← Back</button>
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
                  placeholder={myPlatforms[p.key] ? `your: ${myPlatforms[p.key]}` : "friend's username"}
                  value={friend[p.key]}
                  onChange={e => setFriend(prev => ({ ...prev, [p.key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleCompare()}
                />
              </div>
            </div>
          ))}
        </div>
        {error && <div className="alert err" style={{ marginTop: "1rem" }}><span>✗</span><span>{error}</span></div>}
        <button className="btn btn-primary" style={{ marginTop: "1.25rem" }} onClick={handleCompare} disabled={loading}>
          {loading ? <><Spinner /> Fetching friend's stats…</> : "⚔️ Compare Now"}
        </button>
      </div>

      {/* Results */}
      {result && score && (
        <>
          {/* Scoreboard */}
          <div className="cmp-scoreboard">
            <div className={`cmp-score-side ${iWin ? "cmp-score-win" : ""}`}>
              <div className="cmp-score-name">@{myName}</div>
              <div className="cmp-score-num">{score.myTotal}</div>
              <div className="cmp-score-label">wins</div>
              {iWin && <div className="cmp-score-trophy">🏆 Winner!</div>}
            </div>
            <div className="cmp-score-center">
              <div className="cmp-score-vs">⚔️</div>
              <div className="cmp-score-total">{score.myTotal + score.friendTotal} metrics</div>
              {score.tiedTotal > 0 && <div className="cmp-score-tied">{score.tiedTotal} tied</div>}
              {tied && <div style={{ color: "var(--medium)", fontSize: ".65rem", fontFamily: "'IBM Plex Mono',monospace", marginTop: ".25rem" }}>It's a tie!</div>}
            </div>
            <div className={`cmp-score-side ${friendWins ? "cmp-score-win" : ""}`}
              style={friendWins ? { borderColor: "#f59e0b", background: "rgba(245,158,11,.04)", boxShadow: "0 0 20px rgba(245,158,11,.06)" } : {}}
            >
              <div className="cmp-score-name">Friend</div>
              <div className="cmp-score-num" style={friendWins ? { color: "#f59e0b", textShadow: "0 0 20px rgba(245,158,11,.4)" } : {}}>{score.friendTotal}</div>
              <div className="cmp-score-label">wins</div>
              {friendWins && <div className="cmp-score-trophy">🏆 Winner!</div>}
            </div>
          </div>

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