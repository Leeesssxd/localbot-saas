import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./dashboard.css";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "fa-solid fa-grid-2", label: "Dashboard", badge: null },
  { id: "agenda",    icon: "fa-solid fa-calendar-days", label: "Agenda", badge: null },
  { id: "convos",    icon: "fa-solid fa-comments", label: "Conversaciones", badge: 3 },
  { id: "clientes",  icon: "fa-solid fa-users", label: "Clientes", badge: null },
  { id: "ia",        icon: "fa-solid fa-microchip-ai", label: "Asistente IA", badge: null },
  { id: "config",    icon: "fa-solid fa-sliders", label: "Configuración", badge: null },
];

const WEEK_BARS = [
  { day: "Lun", val: 4,  pct: 50  },
  { day: "Mar", val: 6,  pct: 65  },
  { day: "Mié", val: 7,  pct: 78  },
  { day: "Jue", val: 5,  pct: 56  },
  { day: "Hoy", val: 8,  pct: 90, today: true },
  { day: "Sáb", val: 3,  pct: 33, future: true },
  { day: "Dom", val: 1,  pct: 12, future: true },
];

const CONVERSATIONS = [
  { id: 1, initials: "JR", name: "Jorge Ramírez",   preview: "Hola, ¿tienen espacio para hoy a las 4pm?",       time: "2 min",   tag: "alert",  unread: true,  color: "amber" },
  { id: 2, initials: "MG", name: "María González",  preview: "Gracias, ya quedó mi cita confirmada 👍",          time: "8 min",   tag: "bot",    unread: true,  color: "blue"  },
  { id: 3, initials: "CS", name: "Carlos Soto",     preview: "¿Cuánto cuesta el corte con barba?",              time: "23 min",  tag: "bot",    unread: false, color: "green" },
  { id: 4, initials: "LP", name: "Lucía Paredes",   preview: "Necesito cancelar mi cita de mañana",             time: "45 min",  tag: "human",  unread: false, color: "purple"},
  { id: 5, initials: "AR", name: "Antonio Ríos",    preview: "Ok perfecto, hasta el jueves entonces",           time: "1h",      tag: "bot",    unread: false, color: "red"   },
];

const APPOINTMENTS = [
  { id: 1, time: "10:00", ampm: "AM", name: "Carlos Soto",    service: "Corte + barba · 45 min",    status: "done",      color: "green"  },
  { id: 2, time: "11:30", ampm: "AM", name: "María González", service: "Corte clásico · 30 min",    status: "done",      color: "blue"   },
  { id: 3, time: "2:00",  ampm: "PM", name: "Jorge Ramírez",  service: "Corte degradado · 45 min",  status: "now",       color: "amber", current: true },
  { id: 4, time: "4:00",  ampm: "PM", name: "Antonio Ríos",   service: "Barba completa · 30 min",   status: "pending",   color: "purple" },
  { id: 5, time: "5:30",  ampm: "PM", name: "Lucía Paredes",  service: "Tinte + corte · 60 min",    status: "pending",   color: "red"    },
];

const ALERTS = [
  { id: 1, icon: "fa-solid fa-triangle-exclamation", colorClass: "amber", text: <><strong>Jorge Ramírez</strong> hizo una pregunta que el bot no supo responder. Revisa la conversación.</>, time: "2 min" },
  { id: 2, icon: "fa-solid fa-calendar-xmark",       colorClass: "blue",  text: <><strong>Lucía Paredes</strong> canceló su cita de mañana a las 3pm. Tienes un espacio libre.</>,          time: "45 min" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ icon, iconColor, value, label, sub, badge, badgeType }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className={`kpi-icon kpi-icon--${iconColor}`}>
          <i className={icon} />
        </div>
        {badge && (
          <span className={`kpi-badge kpi-badge--${badgeType}`}>
            {badgeType === "up" && <i className="fa-solid fa-arrow-trend-up" />}
            {badgeType === "warn" && <i className="fa-solid fa-sparkles" />}
            {badge}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function ConvoTag({ type }) {
  const map = {
    bot:   { cls: "tag--bot",   label: "Bot"           },
    human: { cls: "tag--human", label: "Tú"            },
    alert: { cls: "tag--alert", label: "Necesita atención" },
  };
  const { cls, label } = map[type] || {};
  return <span className={`convo-tag ${cls}`}>{label}</span>;
}

function StatusBadge({ status }) {
  const map = {
    done:    { cls: "badge--done",    label: "Completada" },
    now:     { cls: "badge--now",     label: "Ahora"      },
    pending: { cls: "badge--pending", label: "Pendiente"  },
  };
  const { cls, label } = map[status] || {};
  return <span className={`appt-badge ${cls}`}>{label}</span>;
}

function BotStatusRow({ icon, label, children }) {
  return (
    <div className="bsc-row">
      <div className="bsc-row-label">
        <i className={icon} />
        {label}
      </div>
      <div className="bsc-row-val">{children}</div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [chartTab, setChartTab] = useState("semana");

  return (
    <div className="lb-shell">
      {/* ── SIDEBAR ── */}
      <aside className="lb-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo__mark">
            <div className="sidebar-logo__icon">
              <i className="fa-solid fa-robot" />
            </div>
            <div>
              <div className="sidebar-logo__text">
                Local<span>Bot</span>
              </div>
              <div className="sidebar-logo__sub">tu negocio, conectado</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-nav__section">Principal</p>
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "nav-item--active" : ""}`}
              onClick={() => setActiveNav(item.id)}
            >
              <i className={`${item.icon} nav-item__icon`} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-item__badge">{item.badge}</span>}
            </button>
          ))}

          <p className="sidebar-nav__section">Configurar</p>
          {NAV_ITEMS.slice(4).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "nav-item--active" : ""}`}
              onClick={() => setActiveNav(item.id)}
            >
              <i className={`${item.icon} nav-item__icon`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Business card */}
        <div className="sidebar-footer">
          <div className="biz-card">
            <div className="biz-card__avatar">B</div>
            <div className="biz-card__info">
              <div className="biz-card__name">Barbería Don Mario</div>
              <div className="biz-card__plan">Plan Pro · activo</div>
            </div>
            <div className="wa-dot" title="WhatsApp conectado" />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="lb-main">
        {/* Topbar */}
        <header className="lb-topbar">
          <div className="lb-topbar__greeting">
            <h1>Buenos días, Mario <i className="fa-solid fa-hand-wave" style={{ fontSize: 18, color: "#f59e0b" }} /></h1>
            <p>Martes, 10 de junio · WhatsApp conectado y activo</p>
          </div>
          <div className="lb-topbar__actions">
            <button className="btn-ghost">
              <i className="fa-solid fa-plus" />
              Nueva cita
            </button>
            <button className="btn-notif">
              <i className="fa-solid fa-bell" />
              <span className="btn-notif__dot" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="lb-content">
          {/* KPI row */}
          <div className="kpi-grid">
            <KpiCard
              icon="fa-solid fa-calendar-check"
              iconColor="green"
              value="8"
              label="Citas hoy"
              sub="3 completadas · 5 pendientes"
              badge="↑ 12%"
              badgeType="up"
            />
            <KpiCard
              icon="fa-brands fa-whatsapp"
              iconColor="blue"
              value="24"
              label="Mensajes hoy"
              sub="21 respondidos por el bot"
              badge="↑ 8%"
              badgeType="up"
            />
            <KpiCard
              icon="fa-solid fa-peso-sign"
              iconColor="amber"
              value="$2,400"
              label="Ingresos este mes"
              sub="62 citas completadas"
              badge="↑ 5%"
              badgeType="up"
            />
            <KpiCard
              icon="fa-solid fa-users"
              iconColor="purple"
              value="148"
              label="Clientes totales"
              sub="Esta semana"
              badge="+4 nuevos"
              badgeType="warn"
            />
          </div>

          {/* Two-column layout */}
          <div className="lb-grid">
            {/* LEFT */}
            <div className="lb-col-left">
              {/* Chart */}
              <div className="panel">
                <div className="panel__header">
                  <div>
                    <div className="panel__title">Actividad semanal</div>
                    <div className="panel__subtitle">Citas agendadas por día</div>
                  </div>
                  <div className="chart-tabs">
                    {["semana", "mes", "3 meses"].map((t) => (
                      <button
                        key={t}
                        className={`chart-tab ${chartTab === t ? "chart-tab--active" : ""}`}
                        onClick={() => setChartTab(t)}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="panel__body panel__body--chart">
                  <div className="chart-bars">
                    {WEEK_BARS.map((b) => (
                      <div key={b.day} className="chart-bar-col">
                        <div className="chart-bar-wrap">
                          <div
                            className={`chart-bar ${b.today ? "chart-bar--today" : ""} ${b.future ? "chart-bar--future" : ""}`}
                            style={{ height: `${b.pct}%` }}
                            data-val={b.val}
                          />
                        </div>
                        <span className={`chart-day ${b.today ? "chart-day--today" : ""}`}>{b.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversations */}
              <div className="panel" style={{ marginTop: 14 }}>
                <div className="panel__header">
                  <div className="panel__title">Conversaciones recientes</div>
                  <button className="panel__action">
                    Ver todas <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
                <div className="panel__body">
                  {CONVERSATIONS.map((c) => (
                    <div key={c.id} className={`convo-item ${c.unread ? "convo-item--unread" : ""}`}>
                      <div className={`avatar avatar--${c.color}`}>{c.initials}</div>
                      <div className="convo-info">
                        <div className="convo-name">
                          {c.name}
                          {c.tag === "alert" && <ConvoTag type="alert" />}
                        </div>
                        <div className="convo-preview">{c.preview}</div>
                      </div>
                      <div className="convo-meta">
                        <span className="convo-time">{c.time}</span>
                        {c.tag !== "alert" && <ConvoTag type={c.tag} />}
                        {c.unread && c.tag !== "alert" && <span className="unread-dot" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="lb-col-right">
              {/* Bot Status */}
              <div className="panel panel--bot-status">
                <div className="panel__header">
                  <div className="panel__title">Estado del asistente</div>
                  <div className="status-pill">
                    <span className="status-pill__dot" />
                    Activo
                  </div>
                </div>
                <div className="panel__body">
                  <BotStatusRow icon="fa-solid fa-comments" label="Tasa de respuesta">
                    <div className="bsc-progress">
                      <div className="bsc-progress__bar">
                        <div className="bsc-progress__fill" style={{ width: "87%" }} />
                      </div>
                      <span className="bsc-progress__val">87%</span>
                    </div>
                  </BotStatusRow>
                  <BotStatusRow icon="fa-solid fa-clock" label="Tiempo de respuesta">
                    <span className="bsc-val--green">&lt; 30 seg</span>
                  </BotStatusRow>
                  <BotStatusRow icon="fa-solid fa-calendar-check" label="Citas agendadas hoy">
                    <span>5 de 8</span>
                  </BotStatusRow>
                  <BotStatusRow icon="fa-brands fa-whatsapp" label="WhatsApp">
                    <span className="bsc-val--green">Conectado</span>
                  </BotStatusRow>
                </div>
              </div>

              {/* Quick stats */}
              <div className="quick-stats">
                <div className="qs-card">
                  <div className="qs-label">
                    <i className="fa-solid fa-chart-line" style={{ color: "#16a34a" }} />
                    Citas esta semana
                  </div>
                  <div className="qs-value">33<span className="qs-unit">citas</span></div>
                </div>
                <div className="qs-card">
                  <div className="qs-label">
                    <i className="fa-solid fa-star" style={{ color: "#f59e0b" }} />
                    Satisfacción
                  </div>
                  <div className="qs-value">4.8<span className="qs-unit">/5</span></div>
                </div>
              </div>

              {/* Agenda today */}
              <div className="panel" style={{ marginBottom: 14 }}>
                <div className="panel__header">
                  <div className="panel__title">Agenda de hoy</div>
                  <button className="panel__action">
                    Ver completa <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
                <div className="panel__body">
                  <div className="agenda-date-label">
                    <i className="fa-solid fa-calendar" />
                    Martes 10 de junio
                  </div>
                  {APPOINTMENTS.map((a) => (
                    <div key={a.id} className={`appt ${a.current ? "appt--current" : ""}`}>
                      <div className="appt__time">
                        <span className="appt__hour">{a.time}</span>
                        <span className="appt__ampm">{a.ampm}</span>
                      </div>
                      <div className={`appt__stripe appt__stripe--${a.color}`} />
                      <div className="appt__info">
                        <div className="appt__name">{a.name}</div>
                        <div className="appt__service">{a.service}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div className="panel">
                <div className="panel__header">
                  <div className="panel__title">
                    <i className="fa-solid fa-circle-exclamation" style={{ color: "#f59e0b", marginRight: 6 }} />
                    Requiere atención
                  </div>
                </div>
                <div className="panel__body">
                  {ALERTS.map((a) => (
                    <div key={a.id} className="alert-item">
                      <div className={`alert-icon alert-icon--${a.colorClass}`}>
                        <i className={a.icon} />
                      </div>
                      <div className="alert-text">{a.text}</div>
                      <div className="alert-time">{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
