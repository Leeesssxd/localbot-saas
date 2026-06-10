// src/App.jsx
// React Router setup. All dashboard routes are wrapped in AppShell + ProtectedRoute.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Calendar from './pages/Calendar.jsx';
import Services from './pages/Services.jsx';
import Settings from './pages/Settings.jsx';
import AppShell from './components/layout/AppShell.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

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
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<PrivatePage><Dashboard /></PrivatePage>} />
        <Route path="/calendar"  element={<PrivatePage><Calendar /></PrivatePage>} />
        <Route path="/services"  element={<PrivatePage><Services /></PrivatePage>} />
        <Route path="/settings"  element={<PrivatePage><Settings /></PrivatePage>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
