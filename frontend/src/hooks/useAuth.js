import { useState, useEffect } from "react";

const STORAGE_KEYS = {
  TOKEN: "ct_token",
  EMAIL: "ct_email",
  PLATFORMS: "ct_platforms",
};

function useSafeStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export function useAuth() {
  const [token, setToken] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.TOKEN) || null
  );
  const [email, setEmail] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.EMAIL) || ""
  );
  const [platforms, setPlatforms] = useState(() =>
    useSafeStorage(STORAGE_KEYS.PLATFORMS, {})
  );

  const login = (tok, em) => {
    setToken(tok);
    setEmail(em);
    localStorage.setItem(STORAGE_KEYS.TOKEN, tok);
    localStorage.setItem(STORAGE_KEYS.EMAIL, em);
  };

  const savePlatforms = (p) => {
    setPlatforms(p);
    localStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(p));
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setEmail("");
    setPlatforms({});
  };

  const isLoggedIn = !!token;

  return { token, email, platforms, isLoggedIn, login, savePlatforms, logout };
}