import { useState } from "react";

const KEYS = { TOKEN: "ct_token", EMAIL: "ct_email", PLATFORMS: "ct_platforms" };

function readStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function useAuth() {
  const [token,     setToken]     = useState(() => localStorage.getItem(KEYS.TOKEN) || null);
  const [email,     setEmail]     = useState(() => localStorage.getItem(KEYS.EMAIL) || "");
  const [platforms, setPlatforms] = useState(() => readStorage(KEYS.PLATFORMS, {}));

  const login = (tok, em) => {
    setToken(tok); setEmail(em);
    localStorage.setItem(KEYS.TOKEN, tok);
    localStorage.setItem(KEYS.EMAIL, em);
  };

  const savePlatforms = (p) => {
    setPlatforms(p);
    localStorage.setItem(KEYS.PLATFORMS, JSON.stringify(p));
  };

  const logout = () => {
    localStorage.clear();
    setToken(null); setEmail(""); setPlatforms({});
  };

  return { token, email, platforms, isLoggedIn: !!token, login, savePlatforms, logout };
}