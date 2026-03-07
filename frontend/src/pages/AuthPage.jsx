import { useState } from "react";
import api from "../utils/api";

function Spinner() {
  return <span className="spin" style={{ borderTopColor: "#000" }} />;
}

function Alert({ type, msg }) {
  if (!msg) return null;
  return (
    <div className={`alert ${type}`}>
      <span>{type === "err" ? "✗" : "✓"}</span>
      <span>{msg}</span>
    </div>
  );
}

export default function AuthPage({ onSuccess }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [fieldErr, setFieldErr] = useState({});

  const switchMode = (m) => { setMode(m); setError(""); setFieldErr({}); };

  const submit = async () => {
    setError("");
    const errs = {};
    if (!email.includes("@")) errs.email = true;
    if (password.length < 6) errs.password = true;
    if (Object.keys(errs).length) {
      setFieldErr(errs);
      setError("Valid email + password required (min 6 chars).");
      return;
    }
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/signup";
      const data = await api.post(path, { email, password });
      const token = data?.token ?? data?.access_token ?? String(data);
      onSuccess(token, email);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="auth-box">
        <div className="auth-eyebrow">CodeTracker</div>
        <h1 className="auth-title">
          {mode === "login" ? <>Welcome <em>back.</em></> : <>Create <em>account.</em></>}
        </h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Track your competitive programming journey."
            : "Unified stats across LeetCode, Codeforces, HackerRank & GFG."}
        </p>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
            Login
          </button>
          <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>
            Sign Up
          </button>
        </div>

        <Alert type="err" msg={error} />

        <div className="field">
          <label className="field-label">Email</label>
          <input
            className={`field-input ${fieldErr.email ? "err" : ""}`}
            type="email" placeholder="you@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setFieldErr(p => ({ ...p, email: false })); }}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </div>

        <div className="field">
          <label className="field-label">Password</label>
          <input
            className={`field-input ${fieldErr.password ? "err" : ""}`}
            type="password" placeholder="min 6 characters"
            value={password}
            onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: false })); }}
            onKeyDown={e => e.key === "Enter" && submit()}
          />
        </div>

        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <Spinner /> : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}