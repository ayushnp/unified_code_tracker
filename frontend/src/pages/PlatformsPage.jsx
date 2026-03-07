import { useState } from "react";
import { Spinner, Alert, Progress, PlatformInput } from "../components/UI";
import PLATFORMS from "../utils/platforms";
import api from "../utils/api";

export default function PlatformsPage({ token, onSuccess, onSkip }) {
  const [values, setValues] = useState({
    leetcode: "",
    codeforces: "",
    hackerrank: "",
    geeksforgeeks: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const setField = (key, val) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const save = async () => {
    setError("");
    setSuccess(false);

    // Trim all values
    const trimmed = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v.trim()])
    );

    // At least one must be filled
    const any = Object.values(trimmed).some(Boolean);
    if (!any) {
      setError("Please enter at least one platform username.");
      return;
    }

    // Build payload: null for empty fields, string for filled
    // This matches PlatformUsernames schema: anyOf [string, null]
    const payload = Object.fromEntries(
      Object.entries(trimmed).map(([k, v]) => [k, v || null])
    );

    console.log("POST /user/platforms →", payload); // debug

    setLoading(true);
    try {
      await api.post("/user/platforms", payload, token);
      setSuccess(true);
      setTimeout(() => onSuccess(trimmed), 800);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-card">
      <Progress stepIndex={1} />

      <h1 className="ct-title">
        Connect <span>platforms.</span>
      </h1>
      <p className="ct-sub">
        Enter your usernames below. Leave blank any platforms you don't use.
      </p>

      <Alert type="err" msg={error} />
      <Alert type="ok" msg={success ? "Saved! Loading your dashboard…" : ""} />

      {PLATFORMS.map((p) => (
        <PlatformInput
          key={p.key}
          label={p.label}
          short={p.short}
          color={p.color}
          bg={p.bg}
          value={values[p.key]}
          onChange={(val) => setField(p.key, val)}
        />
      ))}

      <button
        className="ct-btn ct-btn-primary"
        onClick={save}
        disabled={loading || success}
      >
        {loading ? <Spinner /> : "Save & Continue →"}
      </button>

      <button className="ct-btn ct-btn-ghost" onClick={onSkip}>
        Skip for now
      </button>

      <p className="ct-skip">You can update these anytime from your dashboard.</p>
    </div>
  );
}