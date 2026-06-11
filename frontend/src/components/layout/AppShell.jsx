import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store.js';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { useTenantStore } from '../../store/tenant.store.js';
import { useThemeStore } from '../../store/theme.store.js';
import BotToggle from '../common/BotToggle.jsx';
import StatusBanner from '../common/StatusBanner.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import client from '../../api/client.js';
import { APP_DATA_CHANGED_EVENT } from '../../lib/app-events.js';
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
  ChevronRightIcon,
  XIcon,
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ appointments: [], conversations: [], services: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { summary, loading: summaryLoading, fetchSummary } = useAnalytics();
  const { tenant, fetchTenant } = useTenantStore();
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  useEffect(() => {
    if (!summary && !summaryLoading) {
      fetchSummary();
    }
  }, [fetchSummary, summary, summaryLoading]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const shouldLock = sidebarOpen || searchOpen;
    const previous = document.body.style.overflow;
    document.body.style.overflow = shouldLock || notificationsOpen ? 'hidden' : previous;

    return () => {
      document.body.style.overflow = previous;
    };
  }, [notificationsOpen, searchOpen, sidebarOpen]);

  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSearchResults({ appointments: [], conversations: [], services: [] });
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await client.get('/search', { params: { q: term } });
        if (!cancelled) {
          setSearchResults(data ?? { appointments: [], conversations: [], services: [] });
        }
      } catch {
        if (!cancelled) {
          setSearchResults({ appointments: [], conversations: [], services: [] });
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery('');
    setSearchResults({ appointments: [], conversations: [], services: [] });
    setSearchOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isCmdK) {
        event.preventDefault();
        setSidebarOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (notificationsOpen && !summary && !summaryLoading) {
      fetchSummary();
    }
  }, [fetchSummary, notificationsOpen, summary, summaryLoading]);

  useEffect(() => {
    const handleAppDataChanged = () => {
      fetchSummary();
    };

    window.addEventListener(APP_DATA_CHANGED_EVENT, handleAppDataChanged);
    return () => window.removeEventListener(APP_DATA_CHANGED_EVENT, handleAppDataChanged);
  }, [fetchSummary]);

  const currentPage = useMemo(() => {
    if (location.pathname.startsWith('/calendar')) return 'Agenda';
    if (location.pathname.startsWith('/messages')) return 'Mensajes';
    if (location.pathname.startsWith('/services')) return 'Servicios';
    if (location.pathname.startsWith('/settings')) return 'Configuración';
    return 'Inicio';
  }, [location.pathname]);

  const status = getTenantStatus(tenant);
  const searchGroups = useMemo(() => {
    const groups = [
      { label: 'Citas', items: searchResults.appointments ?? [] },
      { label: 'Conversaciones', items: searchResults.conversations ?? [] },
      { label: 'Servicios', items: searchResults.services ?? [] },
    ];

    return groups.filter((group) => group.items.length > 0);
  }, [searchResults]);

  const notificationCount = useMemo(() => {
    const pendingToday = summary?.totals?.pendingToday ?? 0;
    const urgentConversations = (summary?.recentConversations ?? []).filter((item) => item.tone === 'amber' || item.status === 'Requiere atención').length;
    return pendingToday + urgentConversations;
  }, [summary]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const first = searchGroups[0]?.items?.[0];
    if (first?.href) {
      navigate(first.href);
      resetSearch();
    }
  };

  const handleSearchSelect = (href) => {
    navigate(href);
    resetSearch();
  };

  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults({ appointments: [], conversations: [], services: [] });
    setSearchOpen(false);
  };

  const openNotifications = () => {
    setSidebarOpen(false);
    setSearchOpen(false);
    setNotificationsOpen(true);
    if (!summary && !summaryLoading) {
      fetchSummary();
    }
  };

  const closeNotifications = () => {
    setNotificationsOpen(false);
  };

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
                {tenant?.businessName ?? 'LocalBot'}
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
              onClick={() => {
                setSearchOpen(false);
                setSidebarOpen(true);
              }}
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

            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                setSearchOpen(true);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
              aria-label="Buscar"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="relative ml-auto hidden max-w-md flex-1 md:block">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <SearchIcon className="h-4 w-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="Buscar citas, clientes o servicios"
                />
              </div>

              {searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-950">
                  {searchLoading ? (
                    <div className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500">Buscando...</div>
                  ) : searchGroups.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-400 dark:text-slate-500">
                      No encontramos coincidencias con ese texto.
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto py-2 scrollbar-thin">
                      {searchGroups.map((group) => (
                        <div key={group.label} className="px-2 py-1">
                          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                            {group.label}
                          </p>
                          <div className="space-y-1">
                            {group.items.map((item) => (
                              <button
                                key={`${item.type}-${item.id}`}
                                type="button"
                                onClick={() => handleSearchSelect(item.href)}
                                className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
                              >
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                  {item.type === 'appointment' ? <CalendarIcon className="h-4 w-4" /> : item.type === 'service' ? <UsersIcon className="h-4 w-4" /> : <MessagesIcon className="h-4 w-4" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                      {item.meta}
                                    </span>
                                  </div>
                                  <p className="mt-1 max-h-10 overflow-hidden text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={notificationCount > 0 ? `Notificaciones, ${notificationCount} pendientes` : 'Notificaciones'}
              onClick={openNotifications}
            >
              <BellIcon className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
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

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm md:hidden" role="presentation" onClick={resetSearch}>
          <div
            className="absolute inset-x-3 top-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-950"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar en LocalBot"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Búsqueda global
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Clientes, citas y servicios
                </p>
              </div>
              <button
                type="button"
                onClick={resetSearch}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Cerrar búsqueda"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={handleSearchSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <SearchIcon className="h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
                    placeholder="Buscar citas, clientes o servicios"
                  />
                </div>
              </form>

              <div className="mt-4">
                {searchQuery.trim().length < 2 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    Escribe al menos 2 caracteres para buscar.
                  </div>
                ) : searchLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                    Buscando...
                  </div>
                ) : searchGroups.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    No encontramos coincidencias.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
                    {searchGroups.map((group) => (
                      <div key={group.label} className="space-y-2">
                        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                          {group.label}
                        </p>
                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <button
                              key={`${item.type}-${item.id}`}
                              type="button"
                              onClick={() => handleSearchSelect(item.href)}
                              className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                            >
                              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                {item.type === 'appointment' ? <CalendarIcon className="h-4 w-4" /> : item.type === 'service' ? <UsersIcon className="h-4 w-4" /> : <MessagesIcon className="h-4 w-4" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                    {item.meta}
                                  </span>
                                </div>
                                <p className="mt-1 max-h-10 overflow-hidden text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {notificationsOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm" role="presentation" onClick={closeNotifications}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-[420px] overflow-hidden border-l border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-950"
            role="dialog"
            aria-modal="true"
            aria-label="Notificaciones y actividad"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Resumen operativo
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-50">
                  Notificaciones
                </h2>
              </div>
              <button
                type="button"
                onClick={closeNotifications}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Cerrar notificaciones"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-81px)] overflow-y-auto px-5 py-5 scrollbar-thin">
              {summaryLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Cargando actividad...
                </div>
              ) : summary ? (
                <div className="space-y-5">
                  <section className="grid gap-3 sm:grid-cols-2">
                    <StatPill label="Citas hoy" value={summary.totals?.todayAppointments ?? 0} tone="emerald" />
                    <StatPill label="Chats activos" value={summary.totals?.activeConversations ?? 0} tone="sky" />
                    <StatPill label="Entrantes" value={summary.totals?.inboundMessages ?? 0} tone="violet" />
                    <StatPill label="Salientes" value={summary.totals?.outboundMessages ?? 0} tone="slate" />
                  </section>

                  <section className="app-card p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                          Próximas citas
                        </p>
                        <h3 className="mt-1 text-base font-bold text-slate-950 dark:text-slate-50">
                          Agenda inmediata
                        </h3>
                      </div>
                      <button onClick={() => { closeNotifications(); navigate('/calendar'); }} className="app-button-ghost text-xs">
                        Ver agenda
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(summary.upcomingAppointments ?? []).length ? (
                        summary.upcomingAppointments.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              closeNotifications();
                              navigate(`/calendar?appointmentId=${encodeURIComponent(item.id)}`);
                            }}
                            className="flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{item.customerName}</p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.service?.name ?? 'Servicio'}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                                {new Date(item.scheduledAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {item.status}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                          No hay citas próximas por ahora.
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="app-card p-4">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                        Conversaciones recientes
                      </p>
                      <h3 className="mt-1 text-base font-bold text-slate-950 dark:text-slate-50">
                        Seguimiento rápido
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {(summary.recentConversations ?? []).length ? (
                        summary.recentConversations.slice(0, 4).map((item) => (
                          <button
                            key={item.customerPhone}
                            type="button"
                            onClick={() => {
                              closeNotifications();
                              navigate(`/messages?phone=${encodeURIComponent(item.customerPhone)}`);
                            }}
                            className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                          >
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              item.tone === 'amber'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                                : item.tone === 'sky'
                                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                            }`}>
                              <MessagesIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{item.customerName}</p>
                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                  {item.status}
                                </span>
                              </div>
                              <p className="mt-1 max-h-10 overflow-hidden text-sm text-slate-500 dark:text-slate-400">{item.preview}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                          Todavía no hay conversaciones recientes.
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button onClick={() => { closeNotifications(); navigate('/messages'); }} className="app-button-primary w-full justify-center">
                      Abrir mensajes
                    </button>
                    <button onClick={() => { closeNotifications(); navigate('/calendar'); }} className="app-button-secondary w-full justify-center">
                      Abrir agenda
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  No se pudo cargar el resumen de actividad.
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-lg font-bold ${tones[tone] ?? tones.slate}`}>{value}</p>
    </div>
  );
}
