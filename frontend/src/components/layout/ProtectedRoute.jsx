// components/layout/ProtectedRoute.jsx
// Redirects unauthenticated users to /login, but first tries to restore a
// valid session from the refresh-token cookie so reloads do not force a logout.

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Navigate, useLocation } from 'react-router-dom';
import RouteLoader from '../common/RouteLoader.jsx';
import { API_BASE_URL } from '../../api/client.js';
import { useAuthStore } from '../../store/auth.store.js';

export default function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();
  const [checkingSession, setCheckingSession] = useState(!accessToken);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (accessToken) {
        setCheckingSession(false);
        return;
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        if (cancelled) return;
        setAccessToken(data.accessToken);
      } catch {
        if (cancelled) return;
        clearAuth();
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, setAccessToken]);

  if (checkingSession) {
    return <RouteLoader />;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
