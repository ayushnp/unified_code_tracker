import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";

export default function App() {
  const [step, setStep] = useState("auth"); // "auth" | "setup" | "dashboard"
  const { token, email, platforms, isLoggedIn, login, savePlatforms, logout } = useAuth();

  useEffect(() => {
    if (isLoggedIn) setStep("dashboard");
  }, []);

  const handleAuth = (tok, em) => {
    login(tok, em);
    setStep("setup");
  };

  const handleSetup = (p) => {
    savePlatforms(p);
    setStep("dashboard");
  };

  const handleLogout = () => {
    logout();
    setStep("auth");
  };

  return (
    <div id="root">
      <header className="app-header">
        <div className="header-logo">
          <div className="header-logo-pulse" />
          CODE_TRACKER
        </div>
        <div className="header-spacer" />
        {isLoggedIn && (
          <>
            <span className="header-email">{email}</span>
            <button className="header-logout" onClick={handleLogout}>logout</button>
          </>
        )}
      </header>

      {step === "auth" && (
        <AuthPage onSuccess={handleAuth} />
      )}
      {step === "setup" && (
        <SetupPage
          token={token}
          onSuccess={handleSetup}
          onSkip={() => setStep("dashboard")}
        />
      )}
      {step === "dashboard" && (
        <DashboardPage
          token={token}
          platforms={platforms}
          email={email}
          onEditPlatforms={() => setStep("setup")}
        />
      )}
    </div>
  );
}