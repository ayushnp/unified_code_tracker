const BASE = "http://localhost:8000"; // ← your FastAPI URL

const api = {
  post: async (path, body, token = null) => {
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        data?.detail?.[0]?.msg ||
        data?.detail ||
        data?.message ||
        `Error ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    return data;
  },

  get: async (path, token = null) => {
    const res = await fetch(BASE + path, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }

    return data;
  },
};

export default api;