import { useState } from "react";

const KEYS = {
  TOKEN:     "ct_token",
  EMAIL:     "ct_email",
  PLATFORMS: "ct_platforms",
  SHARE_ID:  "ct_share_id",
};

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
  const [shareId,   setShareId]   = useState(() => localStorage.getItem(KEYS.SHARE_ID) || null);

  // Called after login/signup — also accepts usernames returned by the API
  const login = (tok, em, sid = null, usernames = null) => {
    setToken(tok);
    setEmail(em);
    localStorage.setItem(KEYS.TOKEN, tok);
    localStorage.setItem(KEYS.EMAIL, em);

    if (sid) {
      setShareId(sid);
      localStorage.setItem(KEYS.SHARE_ID, sid);
    }

    // If server returned saved usernames, restore them
    if (usernames && Object.values(usernames).some(Boolean)) {
      setPlatforms(usernames);
      localStorage.setItem(KEYS.PLATFORMS, JSON.stringify(usernames));
    }
  };

  const savePlatforms = (p) => {
    setPlatforms(p);
    localStorage.setItem(KEYS.PLATFORMS, JSON.stringify(p));
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setEmail("");
    setPlatforms({});
    setShareId(null);
  };

  return {
    token,
    email,
    platforms,
    shareId,
    isLoggedIn: !!token,
    login,
    savePlatforms,
    logout,
  };
}