import { useState, useEffect } from "react";
import api from "../utils/api";
import {
  LeetCodeCard,
  CodeforcesCard,
  HackerRankCard,
  GFGCard,
} from "../components/PlatformCards";

const PLATFORM_ORDER = ["leetcode", "codeforces", "hackerrank", "geeksforgeeks"];

// Store edit tokens in localStorage so users can edit/delete their own comments
const TOKEN_KEY = "ct_comment_tokens"; // { commentId: editToken }
function getTokens() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "{}"); }
  catch { return {}; }
}
function saveToken(id, token) {
  const tokens = getTokens();
  tokens[id] = token;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}
function removeToken(id) {
  const tokens = getTokens();
  delete tokens[id];
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}

// ── Single Comment ─────────────────────────────────────
function Comment({ comment, onEdit, onDelete }) {
  const myToken    = getTokens()[comment.id];
  const isMine     = !!myToken;
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(comment.message);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    await onEdit(comment.id, editText, myToken);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    setDeleting(true);
    await onDelete(comment.id, myToken);
    setDeleting(false);
  };

  return (
    <div className={`comment-item ${isMine ? "comment-mine" : ""}`}>
      <div className="comment-header">
        <div className="comment-avatar">
          {comment.name.charAt(0).toUpperCase()}
        </div>
        <div className="comment-meta">
          <span className="comment-name">
            {comment.name}
            {isMine && <span className="comment-you-badge">you</span>}
          </span>
          <span className="comment-time">
            {formatDate(comment.created_at)}
            {comment.edited && <span className="comment-edited"> · edited</span>}
          </span>
        </div>
        {isMine && !editing && (
          <div className="comment-actions">
            <button className="comment-action-btn" onClick={() => { setEditing(true); setEditText(comment.message); }}>
              ✏️ Edit
            </button>
            <button className="comment-action-btn comment-action-del" onClick={handleDelete} disabled={deleting}>
              {deleting ? "…" : "🗑️ Delete"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="comment-edit-wrap">
          <textarea
            className="comment-textarea"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="comment-edit-actions">
            <button className="comment-save-btn" onClick={handleEdit} disabled={saving || !editText.trim()}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="comment-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="comment-body">{comment.message}</div>
      )}
    </div>
  );
}

// ── Comment Section ────────────────────────────────────
function CommentSection({ shareId }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [name,     setName]     = useState("");
  const [message,  setMessage]  = useState("");
  const [posting,  setPosting]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const loadComments = async () => {
    try {
      const data = await api.get(`/share/${shareId}/comments`);
      setComments(data.comments || []);
    } catch (e) {
      console.error("Failed to load comments:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [shareId]);

  const handlePost = async () => {
    setError(""); setSuccess("");
    if (!name.trim())    { setError("Enter your name."); return; }
    if (!message.trim()) { setError("Enter a message."); return; }
    setPosting(true);
    try {
      const data = await api.post(`/share/${shareId}/comments`, { name: name.trim(), message: message.trim() });
      saveToken(data.id, data.edit_token);
      setComments(prev => [...prev, {
        id: data.id, name: data.name, message: data.message,
        created_at: data.created_at, edited: false,
      }]);
      setMessage("");
      setSuccess("Comment posted!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = async (id, newMessage, token) => {
    try {
      await api.put(`/comments/${id}`, { message: newMessage, edit_token: token });
      setComments(prev => prev.map(c =>
        c.id === id ? { ...c, message: newMessage, edited: true } : c
      ));
    } catch (e) {
      alert("Edit failed: " + e.message);
    }
  };

  const handleDelete = async (id, token) => {
    try {
      await api.delete(`/comments/${id}`, { edit_token: token });
      removeToken(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <div className="comments-title">
          💬 Comments
          <span className="comments-count">{comments.length}</span>
        </div>
      </div>

      {/* Post form */}
      <div className="comment-form">
        <div className="comment-form-title">Leave a comment</div>
        {error   && <div className="alert err" style={{ marginBottom: ".75rem" }}><span>✗</span><span>{error}</span></div>}
        {success && <div className="alert ok"  style={{ marginBottom: ".75rem" }}><span>✓</span><span>{success}</span></div>}
        <input
          className="field-input"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          style={{ marginBottom: ".6rem" }}
        />
        <textarea
          className="comment-textarea"
          placeholder="Write a comment… (max 500 chars)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <div className="comment-form-footer">
          <span className="comment-char-count">{message.length}/500</span>
          <button className="btn btn-primary" style={{ width: "auto", padding: ".5rem 1.5rem" }}
            onClick={handlePost} disabled={posting}>
            {posting ? "Posting…" : "Post Comment →"}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="comments-loading">
          <div className="card-spin" style={{ margin: "0 auto" }} />
        </div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">No comments yet. Be the first!</div>
      ) : (
        <div className="comments-list">
          {comments.map(c => (
            <Comment key={c.id} comment={c} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main SharedPage ────────────────────────────────────
export default function SharedPage({ shareId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get(`/share/${shareId}`)
      .then(d  => { setData(d);          setLoading(false); })
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
    return       { data: d, loading: false, error: null };
  };

  return (
    <div className="dashboard">
      <div className="dash-top">
        <div>
          <div className="dash-greeting">// SHARED DASHBOARD · READ ONLY</div>
          <div className="dash-title"><span>{displayName}</span>'s progress</div>
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: ".7rem",
          color: "var(--muted)", border: "1px solid var(--border)",
          borderRadius: "5px", padding: ".4rem .9rem",
          display: "flex", alignItems: "center", gap: ".5rem",
        }}>
          <span style={{ color: "var(--streak)" }}>👁</span> View only
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

      {connected.map((platform) => {
        const state    = getCardState(platform);
        const username = usernames[platform];
        const props    = { username, ...state };
        if (platform === "leetcode")      return <LeetCodeCard   key={platform} {...props} />;
        if (platform === "codeforces")    return <CodeforcesCard key={platform} {...props} />;
        if (platform === "hackerrank")    return <HackerRankCard key={platform} {...props} />;
        if (platform === "geeksforgeeks") return <GFGCard        key={platform} {...props} />;
        return null;
      })}

      {/* Comments section */}
      <CommentSection shareId={shareId} />
    </div>
  );
}