import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store.js';
import { useTenantStore } from '../../store/tenant.store.js';
import { useThemeStore } from '../../store/theme.store.js';
import BotToggle from '../common/BotToggle.jsx';
import StatusBanner from '../common/StatusBanner.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import client from '../../api/client.js';
import {
  BrandMark,
  BellIcon,
  CalendarIcon,
  GearIcon,
  LogoutIcon,
  MenuIcon,
  MessagesIcon,
  PlusIcon,
  ShieldIcon,
  SearchIcon,
  SparkIcon,
  UsersIcon,
} from '../common/Icons.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: SparkIcon },
  { to: '/calendar', label: 'Agenda', icon: CalendarIcon },
  { to: '/messages', label: 'Mensajes', icon: MessagesIcon },
  { to: '/services', label: 'Servicios', icon: UsersIcon },
  { to: '/settings', label: 'Configuración', icon: GearIcon },
];

function getTenantStatus(tenant) {
  if (!tenant) return { label: 'Sin datos', tone: 'text-slate-500', fill: 'bg-slate-100' };
  if (tenant.status === 'ACTIVE') return { label: 'Activo', tone: 'text-emerald-700', fill: 'bg-emerald-100' };
  if (tenant.status === 'TRIAL') return { label: 'Prueba', tone: 'text-amber-700', fill: 'bg-amber-100' };
  return { label: 'Suspendido', tone: 'text-rose-700', fill: 'bg-rose-100' };
}

function NavItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-100 dark:bg-slate-900 dark:text-emerald-200 dark:ring-emerald-500/15'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              isActive
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700'
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { tenant, fetchTenant } = useTenantStore();
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const currentPage = useMemo(() => {
  if (location.pathname.startsWith('/calendar')) return 'Agenda';
  if (location.pathname.startsWith('/messages')) return 'Mensajes';
  if (location.pathname.startsWith('/services')) return 'Servicios';
    if (location.pathname.startsWith('/settings')) return 'Configuración';
    return 'Inicio';
  }, [location.pathname]);

  const status = getTenantStatus(tenant);

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout');
    } catch {}
    clearAuth();
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/95 p-2 shadow-lg shadow-slate-950/15">
            <BrandMark className="h-full w-full" />
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-slate-950 dark:text-slate-50">LocalBot</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tu negocio, siempre conectado</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {tenant?.businessName ?? 'Negocio de prueba'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tenant?.businessType ?? 'Panel principal'}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.fill} ${status.tone}`}>
              {status.label}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldIcon className="h-4 w-4 text-emerald-600" />
            <span>{tenant?.businessOpen ? 'Bot activo' : 'Bot pausado'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
          Principal
        </div>
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="space-y-3">
          <BotToggle compact />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <LogoutIcon className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[300px] border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:flex">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[300px] border-r border-slate-200/80 bg-white/95 backdrop-blur-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950/95 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </aside>

      <div className="min-h-screen lg:ml-[300px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Abrir menú"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                {currentPage}
              </p>
              <h1 className="font-display text-lg font-bold text-slate-950 dark:text-slate-50 sm:text-xl">
                {tenant?.businessName ?? 'LocalBot'}
              </h1>
            </div>

            <div className="ml-auto hidden max-w-md flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex">
              <SearchIcon className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
                placeholder="Buscar citas, clientes o servicios"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Notificaciones"
            >
              <BellIcon className="h-5 w-5" />
            </button>

            <ThemeToggle />

            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <SparkIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {tenant?.businessOpen ? 'Bot activo' : 'Bot pausado'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">WhatsApp conectado</p>
              </div>
            </div>
          </div>
        </header>

        <StatusBanner />

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
