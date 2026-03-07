import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import AuthPage      from "./pages/AuthPage";
import SetupPage     from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import SharedPage    from "./pages/SharedPage";
import "./index.css";

// Detect if URL is a share link: /share/<uuid>
function getShareId() {
  const match = window.location.pathname.match(/^\/share\/([a-f0-9-]{36})$/i);
  return match ? match[1] : null;
}

export default function App() {
  const urlShareId = getShareId();

  const [step, setStep] = useState("auth");
  const { token, email, platforms, shareId, isLoggedIn, login, savePlatforms, logout } = useAuth();

  useEffect(() => {
    if (urlShareId) return; // shared view — don't auto-route
    if (isLoggedIn) setStep("dashboard");
  }, []);

  // Auth success: token + email + shareId + saved usernames (from login)
  const handleAuth = (tok, em, sid, usernames) => {
    login(tok, em, sid, usernames);
    // If user already has saved usernames → go straight to dashboard
    const hasPlatforms = usernames && Object.values(usernames).some(Boolean);
    setStep(hasPlatforms ? "dashboard" : "setup");
  };

  const handleSetup = (p) => {
    savePlatforms(p);
    setStep("dashboard");
  };

  const handleLogout = () => {
    logout();
    setStep("auth");
  };

  // ── Public share view ──────────────────────────────
  if (urlShareId) {
    return (
      <div id="root">
        <AppHeader email={null} onLogout={null} />
        <SharedPage shareId={urlShareId} />
      </div>
    );
  }

  return (
    <div id="root">
      <AppHeader email={isLoggedIn ? email : null} onLogout={isLoggedIn ? handleLogout : null} />

      {step === "auth" && (
        <AuthPage onSuccess={handleAuth} />
      )}
      {step === "setup" && (
        <SetupPage
          token={token}
          savedPlatforms={platforms}
          onSuccess={handleSetup}
          onSkip={() => setStep("dashboard")}
        />
      )}
      {step === "dashboard" && (
        <DashboardPage
          token={token}
          platforms={platforms}
          email={email}
          shareId={shareId}
          onEditPlatforms={() => setStep("setup")}
        />
      )}
    </div>
  );
}

function AppHeader({ email, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-logo">
        <div className="header-logo-pulse" />
        CODE_TRACKER
      </div>
      <div className="header-spacer" />
      {email && <span className="header-email">{email}</span>}
      {onLogout && (
        <button className="header-logout" onClick={onLogout}>logout</button>
      )}
    </header>
  );
}