import { useState, useEffect, useCallback } from "react";
import { Progress } from "../components/UI";
import PLATFORMS from "../utils/platforms";
import api from "../utils/api";

// ── Single stat card ─────────────────────────────────────────
function StatCard({ platform, stat }) {
  const { label, short, color, bg, statLabel } = platform;
  const isLoading = stat === undefined;
  const isErr = stat === "ERR";

  return (
    <div className="ct-stat" style={{ color }}>
      <span className="ct-stat-badge" style={{ background: bg, color }}>
        {short}
      </span>
      <div className={`ct-stat-val ${isLoading ? "loading" : ""}`}>
        {isLoading ? "…" : isErr ? "—" : stat ?? "—"}
      </div>
      <div className="ct-stat-lbl">
        {label} · {statLabel}
      </div>
    </div>
  );
}

// ── Dashboard page ───────────────────────────────────────────
export default function DashboardPage({ token, platforms, email, onEditPlatforms }) {
  const [stats, setStats] = useState({});

  // Only platforms that have a username configured
  const connected = PLATFORMS.filter((p) => platforms[p.key]);

  const fetchStats = useCallback(async () => {
    setStats({});

    for (const p of connected) {
      const username = encodeURIComponent(platforms[p.key]);

      try {
        console.log(`GET /stats/${p.key}/${username}`); // debug
        const data = await api.get(`/stats/${p.key}/${username}`, token);
        console.log(`Stats [${p.key}]:`, data); // debug

        // Resolve value from common response shapes
        const val =
          typeof data === "object" && data !== null
            ? (data.solved ??
               data.totalSolved ??
               data.rating ??
               data.score ??
               data.total ??
               data.count ??
               "✓")
            : data;

        setStats((s) => ({ ...s, [p.statKey]: val }));
      } catch (e) {
        console.error(`Stats error [${p.key}]:`, e.message);
        setStats((s) => ({ ...s, [p.statKey]: "ERR" }));
      }
    }
  }, [token, platforms]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const displayName = email?.split("@")[0] ?? "coder";

  return (
    <div className="ct-card ct-dash">
      <Progress stepIndex={2} />

      <div className="ct-welcome">
        Hey, <span>{displayName}</span> 👋
      </div>
      <p className="ct-sub" style={{ marginBottom: 0 }}>
        Your coding progress at a glance.
      </p>

      <hr className="ct-divider" />

      {connected.length === 0 ? (
        <div className="ct-empty">
          <div className="ct-empty-icon">🔌</div>
          <p>No platforms connected yet.</p>
          <button
            className="ct-btn ct-btn-ghost"
            style={{ marginTop: "1rem", width: "auto", padding: ".5rem 1.5rem" }}
            onClick={onEditPlatforms}
          >
            Connect platforms
          </button>
        </div>
      ) : (
        <div className="ct-grid">
          {connected.map((p) => (
            <StatCard key={p.key} platform={p} stat={stats[p.statKey]} />
          ))}
        </div>
      )}

      <hr className="ct-divider" />

      <div style={{ display: "flex", gap: ".65rem" }}>
        <button
          className="ct-btn ct-btn-ghost"
          style={{ flex: 1 }}
          onClick={onEditPlatforms}
        >
          ✎ Edit platforms
        </button>
        <button
          className="ct-btn ct-btn-ghost"
          style={{ flex: 1 }}
          onClick={fetchStats}
        >
          ↻ Refresh stats
        </button>
      </div>
    </div>
  );
}