import { useState } from "react";
import { Spinner, Alert, Progress } from "../components/UI";
import api from "../utils/api";

export default function AuthPage({ onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState({ email: false, password: false });

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setFieldErr({ email: false, password: false });
  };

  const validate = () => {
    const errs = {};
    if (!email.includes("@")) errs.email = true;
    if (password.length < 6) errs.password = true;
    setFieldErr(errs);
    if (Object.keys(errs).length) {
      setError("Enter a valid email and password (min 6 chars).");
      return false;
    }
    return true;
  };

  const submit = async () => {
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/signup";
      const data = await api.post(path, { email, password });

      // API returns raw string token
      const token =
        typeof data === "string"
          ? data
          : data?.access_token ?? data?.token ?? String(data);

      onSuccess(token, email);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-card">
      <Progress stepIndex={0} />

      <h1 className="ct-title">
        {mode === "login" ? (
          <>Welcome <span>back.</span></>
        ) : (
          <>Create <span>account.</span></>
        )}
      </h1>
      <p className="ct-sub">
        {mode === "login"
          ? "Sign in to track your coding progress."
          : "Unified stats across LeetCode, Codeforces, HackerRank & GFG."}
      </p>

      {/* Tab toggle */}
      <div className="ct-tabs">
        <button
          className={`ct-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => switchMode("login")}
        >
          Login
        </button>
        <button
          className={`ct-tab ${mode === "signup" ? "active" : ""}`}
          onClick={() => switchMode("signup")}
        >
          Sign up
        </button>
      </div>

      <Alert type="err" msg={error} />

      {/* Email */}
      <div className="ct-field">
        <label className="ct-label">Email</label>
        <input
          className={`ct-input ${fieldErr.email ? "err" : ""}`}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErr((p) => ({ ...p, email: false }));
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      {/* Password */}
      <div className="ct-field">
        <label className="ct-label">Password</label>
        <input
          className={`ct-input ${fieldErr.password ? "err" : ""}`}
          type="password"
          placeholder="min 6 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErr((p) => ({ ...p, password: false }));
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      <button
        className="ct-btn ct-btn-primary"
        onClick={submit}
        disabled={loading}
      >
        {loading ? <Spinner /> : mode === "login" ? "Sign In →" : "Create Account →"}
      </button>
    </div>
  );
}