import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import PlatformsPage from "./pages/PlatformsPage";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";

export default function App() {
  // step: "auth" | "platforms" | "dashboard"
  const [step, setStep] = useState("auth");
  const { token, email, platforms, isLoggedIn, login, savePlatforms, logout } = useAuth();

  // Restore session on mount
  useEffect(() => {
    if (isLoggedIn) setStep("dashboard");
  }, []);

  const handleAuthSuccess = (tok, em) => {
    login(tok, em);
    setStep("platforms");
  };

  const handlePlatformSuccess = (p) => {
    savePlatforms(p);
    setStep("dashboard");
  };

  const handleLogout = () => {
    logout();
    setStep("auth");
  };

  return (
    <div className="ct-root">
      <header className="ct-header">
        <div className="ct-logo">
          Code<em>Tracker</em>
        </div>
        {isLoggedIn && (
          <button className="ct-logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>

      <main className="ct-main">
        {step === "auth" && (
          <AuthPage onSuccess={handleAuthSuccess} />
        )}

        {step === "platforms" && (
          <PlatformsPage
            token={token}
            onSuccess={handlePlatformSuccess}
            onSkip={() => setStep("dashboard")}
          />
        )}

        {step === "dashboard" && (
          <DashboardPage
            token={token}
            platforms={platforms}
            email={email}
            onEditPlatforms={() => setStep("platforms")}
          />
        )}
      </main>
    </div>
  );
}