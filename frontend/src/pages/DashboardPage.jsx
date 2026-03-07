import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";
import {
  LeetCodeCard,
  CodeforcesCard,
  HackerRankCard,
  GFGCard,
} from "../components/PlatformCards";

const PLATFORM_ORDER = ["leetcode", "codeforces", "hackerrank", "geeksforgeeks"];

function RefreshIcon({ spinning }) {
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

export default function DashboardPage({ token, platforms, email, onEditPlatforms }) {
  // Per-platform state: { data, loading, error }
  const [platformState, setPlatformState] = useState({});
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const abortRef = useRef(null);

  const connected = PLATFORM_ORDER.filter(k => platforms[k]?.trim());

  const fetchAll = useCallback(async () => {
    if (connected.length === 0) return;

    // Cancel any in-flight requests
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRefreshing(true);

    // Set all connected platforms to loading
    const initialState = {};
    connected.forEach(k => { initialState[k] = { data: null, loading: true, error: null }; });
    setPlatformState(initialState);

    // Fetch in parallel (GFG is slow so we don't await sequentially)
    const fetches = connected.map(async (platform) => {
      const username = encodeURIComponent(platforms[platform].trim());
      try {
        const data = await api.get(`/stats/${platform}/${username}`, token);
        if (data?.error) throw new Error(data.error);
        setPlatformState(prev => ({
          ...prev,
          [platform]: { data, loading: false, error: null }
        }));
      } catch (e) {
        if (e.name === "AbortError") return;
        setPlatformState(prev => ({
          ...prev,
          [platform]: { data: null, loading: false, error: e.message }
        }));
      }
    });

    await Promise.allSettled(fetches);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [token, platforms, connected.join(",")]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort();
  }, [fetchAll]);

  const displayName = email?.split("@")[0] ?? "coder";

  const formatTime = (d) => {
    if (!d) return null;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="dashboard">
      {/* Top bar */}
      <div className="dash-top">
        <div>
          <div className="dash-greeting">// YOUR PROGRESS DASHBOARD</div>
          <div className="dash-title">
            Hey, <span>{displayName}</span> 👋
          </div>
        </div>
        <div className="dash-actions">
          <button
            className={`dash-btn ${isRefreshing ? "spin-btn" : ""}`}
            onClick={fetchAll}
            disabled={isRefreshing}
          >
            <RefreshIcon spinning={isRefreshing} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button className="dash-btn" onClick={onEditPlatforms}>
            <EditIcon />
            Edit Platforms
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {formatTime(lastUpdated)}
        </div>
      )}

      {/* No platforms */}
      {connected.length === 0 && (
        <div className="no-platforms">
          <div className="no-platforms-icon">🔌</div>
          <p>No platforms connected yet.</p>
          <button className="btn btn-ghost" style={{ width: "auto", padding: ".5rem 1.75rem", margin: "0 auto" }} onClick={onEditPlatforms}>
            Connect Platforms
          </button>
        </div>
      )}

      {/* Platform cards */}
      {connected.map((platform, i) => {
        const state = platformState[platform] || { data: null, loading: true, error: null };
        const username = platforms[platform];

        const cardStyle = { animationDelay: `${i * 0.08}s` };

        if (platform === "leetcode") return (
          <div key={platform} style={cardStyle}>
            <LeetCodeCard
              username={username}
              data={state.data}
              loading={state.loading}
              error={state.error}
            />
          </div>
        );
        if (platform === "codeforces") return (
          <div key={platform} style={cardStyle}>
            <CodeforcesCard
              username={username}
              data={state.data}
              loading={state.loading}
              error={state.error}
            />
          </div>
        );
        if (platform === "hackerrank") return (
          <div key={platform} style={cardStyle}>
            <HackerRankCard
              username={username}
              data={state.data}
              loading={state.loading}
              error={state.error}
            />
          </div>
        );
        if (platform === "geeksforgeeks") return (
          <div key={platform} style={cardStyle}>
            <GFGCard
              username={username}
              data={state.data}
              loading={state.loading}
              error={state.error}
            />
          </div>
        );
        return null;
      })}
    </div>
  );
}