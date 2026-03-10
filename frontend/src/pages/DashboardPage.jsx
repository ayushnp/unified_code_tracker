import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import {
  LeetCodeCard,
  CodeforcesCard,
  HackerRankCard,
  GFGCard,
} from "../components/PlatformCards";

const PLATFORM_ORDER = ["leetcode", "codeforces", "hackerrank", "geeksforgeeks"];
const BASE_URL = "https://uctss.vercel.app";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}

// ── Owner Comments Panel ────────────────────────────────
function OwnerCommentsPanel({ shareId, token }) {
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [deleting,  setDeleting]  = useState(null); // id being deleted
  const [error,     setError]     = useState("");

  const load = useCallback(async () => {
    if (!shareId) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/share/${shareId}/comments`);
      setComments(data.comments || []);
    } catch (e) {
      setError("Could not load comments: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this comment from your profile?")) return;
    setDeleting(id);
    try {
      // Owner deletes using their auth token — no edit_token needed
      await api.delete(`/comments/${id}/owner`, null, token);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="owner-comments-panel">
      <div className="owner-comments-header">
        <div className="owner-comments-title">
          💬 Comments on your profile
          <span className="comments-count">{comments.length}</span>
        </div>
        <button className="dash-btn" onClick={load} style={{ fontSize: ".65rem", padding: ".3rem .75rem" }}>
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="alert err" style={{ marginBottom: ".75rem" }}>
          <span>✗</span><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: ".65rem", padding: ".5rem 0",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: ".75rem", color: "var(--muted)" }}>
          <div className="card-spin" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <div className="owner-comments-empty">
          No comments yet. Share your profile link to get some!
        </div>
      ) : (
        <div className="owner-comments-list">
          {comments.map(c => (
            <div key={c.id} className="owner-comment-item">
              <div className="owner-comment-avatar">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="owner-comment-body">
                <div className="owner-comment-meta">
                  <span className="owner-comment-name">{c.name}</span>
                  <span className="owner-comment-time">
                    {formatDate(c.created_at)}
                    {c.edited && <span className="comment-edited"> · edited</span>}
                  </span>
                </div>
                <div className="owner-comment-text">{c.message}</div>
              </div>
              <button
                className="owner-delete-btn"
                onClick={() => handleDelete(c.id)}
                disabled={deleting === c.id}
                title="Delete comment"
              >
                {deleting === c.id ? "…" : "🗑️"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────
export default function DashboardPage({ token, platforms, email, shareId, onEditPlatforms, onCompare }) {
  const [stats,        setStats]        = useState({});
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [fromCache,    setFromCache]    = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);
  const [copied,       setCopied]       = useState(false);
  const [showComments, setShowComments] = useState(false);

  const connected = PLATFORM_ORDER.filter(k => platforms[k]?.trim());

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

  const handleShare = () => {
    if (!shareId) return;
    const url = `${BASE_URL}/share/${shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const displayName = email?.split("@")[0] ?? "coder";
  const formatTime  = (iso) => {
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
    return           { data: d, loading: false, error: null };
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
          <button className="dash-btn"
            onClick={onCompare}
            style={{ borderColor: "rgba(139,92,246,.35)", color: "#8b5cf6" }}>
            <CompareIcon /> Compare
          </button>

          {/* Comments toggle */}
          <button
            className="dash-btn"
            onClick={() => setShowComments(p => !p)}
            style={{
              borderColor: showComments ? "rgba(251,146,60,.5)" : undefined,
              color: showComments ? "var(--streak)" : undefined,
            }}
          >
            <CommentIcon /> Comments
          </button>

          <button className="dash-btn" onClick={handleShare} disabled={!shareId}>
            <ShareIcon /> {copied ? "Link Copied!" : "Share"}
          </button>

          <button className={`dash-btn ${isRefreshing ? "spin-btn" : ""}`}
            onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshIcon /> {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button className="dash-btn" onClick={onEditPlatforms}>
            <EditIcon /> Edit Platforms
          </button>
        </div>
      </div>

      {/* Status bar */}
      {(lastUpdated || fromCache) && (
        <div className="last-updated">
          {fromCache ? "📦 Showing cached data" : "✓ Live data"}&nbsp;·&nbsp;
          Last updated: {formatTime(lastUpdated) ?? "—"}
          {fromCache && (
            <span style={{ color: "var(--glow2)", marginLeft: ".5rem" }}>
              · Hit Refresh to fetch latest
            </span>
          )}
        </div>
      )}

      {/* Owner comments panel — shown when toggled */}
      {showComments && shareId && (
        <OwnerCommentsPanel shareId={shareId} token={token} />
      )}

      {/* No platforms */}
      {!isLoading && connected.length === 0 && (
        <div className="no-platforms">
          <div className="no-platforms-icon">🔌</div>
          <p>No platforms connected yet.</p>
          <button className="btn btn-ghost"
            style={{ width: "auto", padding: ".5rem 1.75rem", margin: "0 auto" }}
            onClick={onEditPlatforms}>
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

function CompareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
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