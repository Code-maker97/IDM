import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "spath_session_token";

// NOTE: Auth is primarily handled via httpOnly cookies (set by the server on /auth/session).
// localStorage is used only as a fallback to attach a Bearer header for environments
// where cookies may not propagate (e.g., cross-origin API calls). Never store
// high-value secrets here; this token is only as sensitive as a session cookie.

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch (error) {
    console.warn("localStorage unavailable:", error);
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.warn("localStorage unavailable:", error);
  }
};

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
