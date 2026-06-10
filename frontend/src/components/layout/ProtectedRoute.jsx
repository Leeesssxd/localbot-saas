// components/layout/ProtectedRoute.jsx
// Redirects unauthenticated users to /login.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store.js';

export default function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
