// src/App.jsx
// React Router setup. All dashboard routes are wrapped in AppShell + ProtectedRoute.

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import RouteLoader from './components/common/RouteLoader.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Calendar = lazy(() => import('./pages/Calendar.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<PrivatePage><Dashboard /></PrivatePage>} />
          <Route path="/calendar"  element={<PrivatePage><Calendar /></PrivatePage>} />
          <Route path="/messages"  element={<PrivatePage><Messages /></PrivatePage>} />
          <Route path="/services"  element={<PrivatePage><Services /></PrivatePage>} />
          <Route path="/settings"  element={<PrivatePage><Settings /></PrivatePage>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
