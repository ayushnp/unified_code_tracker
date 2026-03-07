import { useState } from "react";
import api from "../utils/api";

const PLATFORMS = [
  { key: "leetcode",      label: "LeetCode",      short: "LC",  color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  { key: "codeforces",    label: "Codeforces",    short: "CF",  color: "#3b82f6", bg: "rgba(59,130,246,.12)" },
  { key: "hackerrank",    label: "HackerRank",    short: "HR",  color: "#10b981", bg: "rgba(16,185,129,.12)" },
  { key: "geeksforgeeks", label: "GeeksForGeeks", short: "GFG", color: "#8b5cf6", bg: "rgba(139,92,246,.12)" },
];

function Spinner() {
  return <span className="spin" style={{ borderTopColor: "#000" }} />;
}

export default function SetupPage({ token, savedPlatforms = {}, onSuccess, onSkip }) {
  // Pre-fill with whatever was saved in DB / localStorage
  const [values, setValues] = useState({
    leetcode:      savedPlatforms.leetcode      || "",
    codeforces:    savedPlatforms.codeforces    || "",
    hackerrank:    savedPlatforms.hackerrank    || "",
    geeksforgeeks: savedPlatforms.geeksforgeeks || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [ok,      setOk]      = useState(false);

  const save = async () => {
    setError(""); setOk(false);
    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
    if (!Object.values(trimmed).some(Boolean)) {
      setError("Enter at least one platform username.");
      return;
    }
    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(trimmed).map(([k, v]) => [k, v || null]));
      await api.post("/user/platforms", payload, token);
      setOk(true);
      setTimeout(() => onSuccess(trimmed), 750);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="setup-box">
        <div className="auth-eyebrow">Platform Setup</div>
        <h1 className="auth-title">Connect <em>platforms.</em></h1>
        <p className="auth-sub">
          Enter your usernames below. Leave blank any platforms you don't use.
        </p>

        {error && <div className="alert err"><span>✗</span><span>{error}</span></div>}
        {ok    && <div className="alert ok"><span>✓</span><span>Saved! Loading dashboard…</span></div>}

        <div className="setup-grid">
          {PLATFORMS.map(p => (
            <div className="field" key={p.key}>
              <label className="field-label">{p.label}</label>
              <div className="field-with-badge">
                <span className="field-badge" style={{ background: p.bg, color: p.color }}>{p.short}</span>
                <input
                  className="field-input"
                  type="text"
                  placeholder={`${p.label.toLowerCase()} username`}
                  value={values[p.key]}
                  onChange={e => setValues(prev => ({ ...prev, [p.key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && save()}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <button className="btn btn-primary" onClick={save} disabled={loading || ok}>
            {loading ? <Spinner /> : "Save & Open Dashboard →"}
          </button>
          <button className="btn btn-ghost" onClick={onSkip}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}