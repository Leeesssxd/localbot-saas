import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store.js';
import client from '../api/client.js';
import { BrandMark, ShieldIcon, SparkIcon, UsersIcon } from '../components/common/Icons.jsx';
import '../styles/login.scss';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await client.post('/auth/login', { email, password });
      setAuth(data.accessToken, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-surface">
        <div className="login-orbs" aria-hidden="true" />

        <aside className="login-hero">
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-lg">
                <BrandMark className="h-full w-full" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">LocalBot</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Tu negocio, siempre conectado</h1>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">Panel operativo</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Controla WhatsApp, agenda y servicios desde un solo lugar.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-200/90">
                El frontend principal mezcla la claridad funcional de la primera propuesta con los bloques visuales y métricas de las otras dos, sin emojis y con una interfaz más seria.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Feature icon={ShieldIcon} title="Acceso seguro" text="JWT + refresh token" />
              <Feature icon={SparkIcon} title="Bot activo" text="WhatsApp conectado" />
              <Feature icon={UsersIcon} title="Panel claro" text="Agenda, servicios y ajustes" />
            </div>
          </div>
        </aside>

        <main className="login-panel">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Inicio de sesión</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-50">Entra al panel</h2>
              <p className="mt-2 text-sm text-slate-300">Usa tus credenciales de administrador para entrar al dashboard.</p>
            </div>

            <div className="login-form-card">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@negocio.com"
                    className="app-input bg-slate-900 text-slate-100 placeholder:text-slate-500 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="app-input bg-slate-900 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="app-button-primary w-full disabled:opacity-50">
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} LocalBot. Todos los derechos reservados.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="login-feature">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/70">{text}</p>
    </div>
  );
}
