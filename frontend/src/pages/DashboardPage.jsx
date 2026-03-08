  import { useState, useEffect, useCallback } from "react";
  import api from "../utils/api";
  import {
    LeetCodeCard,
    CodeforcesCard,
    HackerRankCard,
    GFGCard,
  } from "../components/PlatformCards";

  const PLATFORM_ORDER = ["leetcode", "codeforces", "hackerrank", "geeksforgeeks"];

 const BASE_URL = "https://unifiedcodetracker.vercel.app"; // change to your deployed URL in production

  export default function DashboardPage({ token, platforms, email, shareId, onEditPlatforms }) {
    const [stats,        setStats]        = useState({});
    const [lastUpdated,  setLastUpdated]  = useState(null);
    const [fromCache,    setFromCache]    = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading,    setIsLoading]    = useState(true);
    const [copied,       setCopied]       = useState(false);

    const connected = PLATFORM_ORDER.filter(k => platforms[k]?.trim());

    // ── Load cached data on mount ──────────────────────
    const loadCache = useCallback(async () => {
      setIsLoading(true);
      try {
        const data = await api.get("/user/dashboard/cached", token);
        if (data?.stats && Object.keys(data.stats).length > 0) {
          setStats(data.stats);
          setLastUpdated(data.last_updated);
          setFromCache(true);
        }
      } catch (e) {
        console.error("Cache load failed:", e.message);
      } finally {
        setIsLoading(false);
      }
    }, [token]);

    useEffect(() => { loadCache(); }, [loadCache]);

    // ── Refresh: fetch live from all platforms ─────────
    const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
        const data = await api.get("/user/dashboard/refresh", token);
        setStats(data.stats || {});
        setLastUpdated(data.last_updated);
        setFromCache(false);
      } catch (e) {
        console.error("Refresh failed:", e.message);
      } finally {
        setIsRefreshing(false);
      }
    };

    // ── Copy share link ────────────────────────────────
    const handleShare = () => {
      if (!shareId) return;
      const url = `${BASE_URL}/share/${shareId}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    };

    const displayName  = email?.split("@")[0] ?? "coder";
    const formatTime   = (iso) => {
      if (!iso) return null;
      try {
        return new Date(iso + "Z").toLocaleString("en-US", {
          month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
      } catch { return iso; }
    };

    const getCardState = (platform) => {
      if (isLoading)   return { data: null, loading: true,  error: null };
      const d = stats[platform];
      if (!d)          return { data: null, loading: false, error: null };
      if (d.error)     return { data: null, loading: false, error: d.error };
      return           { data: d,  loading: false, error: null };
    };

    return (
      <div className="dashboard">

        {/* Top bar */}
        <div className="dash-top">
          <div>
            <div className="dash-greeting">// YOUR PROGRESS DASHBOARD</div>
            <div className="dash-title">Hey, <span>{displayName}</span> 👋</div>
          </div>
          <div className="dash-actions">
            {/* Share button */}
            <button className="dash-btn" onClick={handleShare} disabled={!shareId}>
              <ShareIcon />
              {copied ? "Link Copied!" : "Share"}
            </button>

            {/* Refresh button */}
            <button
              className={`dash-btn ${isRefreshing ? "spin-btn" : ""}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshIcon />
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>

            <button className="dash-btn" onClick={onEditPlatforms}>
              <EditIcon />
              Edit Platforms
            </button>
          </div>
        </div>

        {/* Status bar */}
        {(lastUpdated || fromCache) && (
          <div className="last-updated">
            {fromCache ? "📦 Showing cached data" : "✓ Live data"}&nbsp;·&nbsp;
            Last updated: {formatTime(lastUpdated) ?? "—"}
            {fromCache && <span style={{ color: "var(--glow2)", marginLeft: ".5rem" }}>
              · Hit Refresh to fetch latest
            </span>}
          </div>
        )}

        {/* No platforms */}
        {!isLoading && connected.length === 0 && (
          <div className="no-platforms">
            <div className="no-platforms-icon">🔌</div>
            <p>No platforms connected yet.</p>
            <button
              className="btn btn-ghost"
              style={{ width: "auto", padding: ".5rem 1.75rem", margin: "0 auto" }}
              onClick={onEditPlatforms}
            >
              Connect Platforms
            </button>
          </div>
        )}

        {/* Platform cards */}
        {connected.map((platform, i) => {
          const state    = getCardState(platform);
          const username = platforms[platform];
          const props    = { username, ...state, style: { animationDelay: `${i * 0.07}s` } };

          if (platform === "leetcode")      return <LeetCodeCard   key={platform} {...props} />;
          if (platform === "codeforces")    return <CodeforcesCard key={platform} {...props} />;
          if (platform === "hackerrank")    return <HackerRankCard key={platform} {...props} />;
          if (platform === "geeksforgeeks") return <GFGCard        key={platform} {...props} />;
          return null;
        })}
      </div>
    );
  }

  // ── Icons ──────────────────────────────────────────────
  function RefreshIcon() {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M1 4v6h6M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    );
  }
  function EditIcon() {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    );
  }
  function ShareIcon() {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    );
  }
