import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import AuthPage      from "./pages/AuthPage";
import SetupPage     from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import SharedPage    from "./pages/SharedPage";
import Comparepage   from "./pages/Comparepage.jsx";
import "./index.css";

function getShareId() {
  const match = window.location.pathname.match(/^\/share\/([a-f0-9-]{36})$/i);
  return match ? match[1] : null;
}

export default function App() {
  const urlShareId = getShareId();
  const [step, setStep] = useState("auth");
  const { token, email, platforms, shareId, isLoggedIn, login, savePlatforms, logout } = useAuth();

  useEffect(() => {
    if (urlShareId) return;
    if (isLoggedIn) setStep("dashboard");
  }, []);

  const handleAuth = (tok, em, sid, usernames) => {
    login(tok, em, sid, usernames);
    const hasPlatforms = usernames && Object.values(usernames).some(Boolean);
    setStep(hasPlatforms ? "dashboard" : "setup");
  };

  const handleSetup = (p) => { savePlatforms(p); setStep("dashboard"); };
  const handleLogout = () => { logout(); setStep("auth"); };

  if (urlShareId) {
    return (
      <div id="root">
        <AppHeader />
        <SharedPage shareId={urlShareId} />
      </div>
    );
  }

  return (
    <div id="root">
      <AppHeader
        email={isLoggedIn ? email : null}
        onLogout={isLoggedIn ? handleLogout : null}
        onCompare={step === "dashboard" ? () => setStep("compare") : null}
        onDashboard={step === "compare"  ? () => setStep("dashboard") : null}
      />

      {step === "auth" && <AuthPage onSuccess={handleAuth} />}

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
          onCompare={() => setStep("compare")}
        />
      )}

      {step === "compare" && (
        <Comparepage
          token={token}
          myPlatforms={platforms}
          myEmail={email}
          onBack={() => setStep("dashboard")}
        />
      )}
    </div>
  );
}

function AppHeader({ email, onLogout, onCompare, onDashboard }) {
  return (
    <header className="app-header">
      <div className="header-logo">
        <div className="header-logo-pulse" />
        CODE_TRACKER
      </div>
      <div className="header-spacer" />
      {email && <span className="header-email">{email}</span>}
      {onDashboard && (
        <button className="header-logout" onClick={onDashboard}>← Dashboard</button>
      )}
      {onCompare && (
        <button
          className="header-logout"
          style={{ borderColor: "rgba(139,92,246,.4)", color: "#8b5cf6" }}
          onClick={onCompare}
        >
          ⚔️ Compare
        </button>
      )}
      {onLogout && (
        <button className="header-logout" onClick={onLogout}>logout</button>
      )}
    </header>
  );
}