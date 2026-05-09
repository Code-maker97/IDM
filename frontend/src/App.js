import React, { useEffect, useState, useCallback, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import MapApp from "./pages/MapApp";
import Admin from "./pages/Admin";
import { api, setToken, getToken } from "./lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Skip /me check if handling OAuth callback
    if (window.location.hash && window.location.hash.includes("session_id=")) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  // Dev login — no OAuth needed
  const devLogin = async () => {
    try {
      const res = await api.post("/auth/dev-login", { name: "Demo User", email: "demo@surakshitpath.in" });
      if (res.data?.session_token) setToken(res.data.session_token);
      setUser(res.data.user);
    } catch (e) {
      console.error("Dev login failed", e);
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth, logout, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const fragment = window.location.hash.slice(1);
    const params = new URLSearchParams(fragment);
    const sessionId = params.get("session_id");
    if (!sessionId) { navigate("/", { replace: true }); return; }
    (async () => {
      try {
        const res = await api.post("/auth/session", { session_id: sessionId });
        if (res.data?.session_token) setToken(res.data.session_token);
        setUser(res.data.user);
        window.history.replaceState({}, "", "/app");
        navigate("/app", { replace: true, state: { user: res.data.user } });
      } catch (e) {
        console.error("Auth callback failed", e);
        navigate("/", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-base">
      <div className="text-zinc-400 font-heading text-sm uppercase tracking-[0.3em]">Signing you in…</div>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-base">
        <div className="text-zinc-500 font-heading text-xs uppercase tracking-[0.3em]">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/app" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash && location.hash.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<ProtectedRoute><MapApp /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
