import { useState, useEffect } from "react";
import api from "../utils/api";
import {
  LeetCodeCard,
  CodeforcesCard,
  HackerRankCard,
  GFGCard,
} from "../components/PlatformCards";

const PLATFORM_ORDER = ["leetcode", "codeforces", "hackerrank", "geeksforgeeks"];

export default function SharedPage({ shareId }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    api.get(`/share/${shareId}`)
    //api.get(`/share/${shareId}`)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [shareId]);

  const formatTime = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso + "Z").toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  if (loading) return (
    <div className="page-center">
      <div style={{ textAlign: "center", color: "var(--muted)", fontFamily: "'IBM Plex Mono', monospace", fontSize: ".85rem" }}>
        <div className="card-spin" style={{ margin: "0 auto 1rem" }} />
        Loading shared dashboard…
      </div>
    </div>
  );

  if (error) return (
    <div className="page-center">
      <div style={{ textAlign: "center", color: "var(--hard)", fontFamily: "'IBM Plex Mono', monospace", fontSize: ".85rem" }}>
        ⚠ {error === "Error 404" ? "Share link not found or has been removed." : error}
      </div>
    </div>
  );

  const { email, usernames, stats, last_updated } = data;
  const displayName = email?.split("@")[0] ?? "user";
  const connected   = PLATFORM_ORDER.filter(k => usernames?.[k]?.trim());

  const getCardState = (platform) => {
    const d = stats?.[platform];
    if (!d)      return { data: null, loading: false, error: null };
    if (d.error) return { data: null, loading: false, error: d.error };
    return       { data: d,  loading: false, error: null };
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-top">
        <div>
          <div className="dash-greeting">// SHARED DASHBOARD · READ ONLY</div>
          <div className="dash-title"><span>{displayName}</span>'s progress</div>
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: ".7rem",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: "5px",
            padding: ".4rem .9rem",
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
          }}
        >
          <span style={{ color: "var(--streak)" }}>👁</span>
          View only
        </div>
      </div>

      {last_updated && (
        <div className="last-updated">
          📦 Cached data · Last updated: {formatTime(last_updated) ?? "—"}
        </div>
      )}

      {connected.length === 0 && (
        <div className="no-platforms">
          <div className="no-platforms-icon">📊</div>
          <p>No platform data available yet.</p>
        </div>
      )}

      {connected.map((platform, i) => {
        const state    = getCardState(platform);
        const username = usernames[platform];
        const props    = { username, ...state };

        if (platform === "leetcode")      return <LeetCodeCard   key={platform} {...props} />;
        if (platform === "codeforces")    return <CodeforcesCard key={platform} {...props} />;
        if (platform === "hackerrank")    return <HackerRankCard key={platform} {...props} />;
        if (platform === "geeksforgeeks") return <GFGCard        key={platform} {...props} />;
        return null;
      })}
    </div>
  );
}