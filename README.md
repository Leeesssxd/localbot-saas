# LocalBot

WhatsApp AI appointment bot for local businesses. SaaS platform — businesses are tenants.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js 20 + Fastify 4 + Prisma 5 |
| Database | PostgreSQL (Supabase free tier recommended) |
| AI | Gemini Flash Lite (preferred) · Groq fallback |
| Frontend | React 18 + Vite + Tailwind CSS + FullCalendar |
| Deploy | Backend → Render · Frontend → Vercel |

---

## Local Development (Windows, no Docker)

### Prerequisites
- Node.js 20+
- A PostgreSQL database (Supabase free tier: https://supabase.com)
- A Gemini API key from Google AI Studio, and optionally a Groq API key for fallback

### 1. Clone and install

```bash
git clone <repo-url>
cd localbot
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT secrets, GEMINI_API_KEY
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Apply the EXCLUDE constraint (paste in Supabase SQL Editor)
# See: prisma/add_exclude_constraint.sql

# Seed dev data
node prisma/seed.js

# Start dev server (auto-restarts on file change)
npm run dev
```

Backend runs at: http://localhost:3000

If the backend refuses to stay up on first launch, run `npm run doctor` inside `backend/` to check DNS, port reachability, missing secrets, and the Supabase connection string shape. For Supabase direct Postgres, keep the host as-is; the backend now adds `sslmode=require` automatically when it is missing.

### 3. Frontend setup

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

Login credentials (from seed):
- Email: `admin@localbot.dev`
- Password: `admin123`

---

## Deployment

### Backend → Render

1. Create a new Render Web Service
2. Select `Docker` as the runtime
3. Set root directory to `backend`
4. Set Dockerfile path to `backend/Dockerfile`
5. Add environment variables (copy from `.env.example`)
6. Point `DATABASE_URL` to your Supabase Session pooler URI
7. After first deploy, run the EXCLUDE constraint SQL in your database

### Frontend → Vercel

1. Import GitHub repo in Vercel
2. Set root directory to `frontend`
3. Set `VITE_API_URL` environment variable to your Render backend URL
4. Deploy

---

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/webhook/:tenantId` | Meta challenge verification |
| POST | `/webhook/:tenantId` | Inbound WhatsApp messages |

### Authenticated (Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login → access + refresh token |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/tenants/me` | Get tenant config |
| PUT | `/tenants/me` | Update tenant config |
| GET | `/tenants/me/schedule` | Get weekly schedule |
| PUT | `/tenants/me/schedule` | Update weekly schedule |
| GET | `/services` | List services |
| POST | `/services` | Create service |
| PUT | `/services/:id` | Update service |
| DELETE | `/services/:id` | Soft-delete service |
| GET | `/appointments` | List appointments (with `from`/`to` query params) |
| POST | `/appointments` | Create manual appointment |
| PATCH | `/appointments/:id` | Update appointment status |

---

## WhatsApp Bot Setup (Per Tenant)

1. Create a Meta App at https://developers.facebook.com/apps
2. Add WhatsApp product
3. Configure webhook:
   - URL: `https://<your-backend>/webhook/<tenantId>`
   - Verify Token: from Settings page or DB `webhookVerifyToken` field
   - Subscribe to: `messages`
4. Copy Phone Number ID and generate a permanent token
5. Update tenant in DB: `phoneNumberId`, `waAccessToken`
6. Add `META_APP_SECRET` to backend env (from your Meta App settings)

### AI Provider Recommendation

- `AI_PROVIDER=gemini` is the recommended choice for the bot right now if you want the cheapest Gemini path with good quality.
- `GEMINI_MODEL=gemini-3.1-flash-lite` is the default low-cost model.
- `GEMINI_MODEL=gemini-3.5-flash` is the better-quality option if you want stronger responses.
- If you leave `AI_PROVIDER` unset and `GEMINI_API_KEY` is present, the backend now prefers Gemini automatically.
- The assistant prompt is designed to behave like a manager/receptionist: answer questions, book appointments, or hand off to a human when needed.

---

## Repository Structure

```
localbot/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Full DB schema
│   │   ├── seed.js                # Dev seed data
│   │   └── add_exclude_constraint.sql  # Run manually once
│   ├── src/
│   │   ├── app.js                 # Fastify entry point
│   │   ├── config/env.js          # Validated env config
│   │   ├── shared/                # db, logger, errors
│   │   ├── modules/
│   │   │   ├── webhook/           # Meta webhook handling
│   │   │   ├── ai/                # Groq + Gemini clients
│   │   │   ├── whatsapp/          # Outbound messaging
│   │   │   ├── appointments/      # Booking logic
│   │   │   ├── auth/              # JWT + refresh tokens
│   │   │   ├── tenants/           # Tenant config
│   │   │   └── services/          # Service catalog
│   │   └── jobs/                  # Cron: trial suspension
│   ├── Dockerfile
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── App.jsx                # Router
    │   ├── api/client.js          # Axios + JWT interceptors
    │   ├── store/                 # Zustand state
    │   ├── hooks/                 # useAppointments, useServices
    │   ├── pages/                 # Login, Dashboard, Calendar, Services, Settings
    │   └── components/            # AppShell, CalendarView, ServiceList, etc.
    └── vercel.json
```

---

## Frontend Update Notes

El frontend principal fue rediseñado para fusionar las dos propuestas visuales que compartiste:

- La segunda propuesta aportó la estructura más completa del panel: sidebar más rica, bloques de conversación, estado del bot y tarjetas con mejor jerarquía.
- La tercera propuesta aportó el enfoque de métricas de hoy, actividad reciente y lectura ejecutiva del negocio.
- El frontend actual conserva la funcionalidad real del proyecto: login, dashboard, agenda, servicios y configuración conectados al backend existente.

### Qué se actualizó

- `AppShell` con sidebar y topbar renovados.
- `Login` con layout de dos columnas y branding más fuerte.
- `Dashboard` con hero, métricas, actividad semanal, agenda de hoy, conversaciones y alertas.
- `Calendar` con tarjetas de resumen y un flujo visual más limpio.
- `Services` con KPIs, formulario mejor presentado y tabla más sólida.
- `Settings` con secciones de negocio, horario y WhatsApp más claras.
- Componentes compartidos sin emojis y con íconos SVG locales.

### Recomendación WhatsApp

Para producción, la ruta más segura sigue siendo la **WhatsApp Cloud API oficial de Meta**.

- Si el objetivo es un MVP serio y escalable, conviene mantener Meta como proveedor directo.
- Si el problema es fricción de onboarding, un BSP como **Twilio** puede reducir trabajo operativo para prototipos y primeras pruebas, pero sigue montado sobre la plataforma oficial de WhatsApp y normalmente no elimina por completo el ecosistema de Meta.
- Para pruebas rápidas, la combinación más simple es usar el **test number de Meta** o el **Twilio Sandbox** antes de pasar al número productivo.

### Requisitos

- [Requisitos funcionales resumidos](./docs/requisitos-funcionales.md)

### Arranque rápido en PowerShell

Desde la raíz del proyecto:

```powershell
cd "C:\Users\wolf_\OneDrive\Documentos\localbot-mvp"
.\start-all.ps1
```

Para cerrar todo antes de volver a levantarlo:

```powershell
cd "C:\Users\wolf_\OneDrive\Documentos\localbot-mvp"
.\stop-all.ps1
```

`start-all.ps1` ejecuta primero `stop-all.ps1` para liberar los puertos `3000` y `5173`, y luego levanta backend + frontend.

Correo:
admin@localbot.dev

Contraseña:
admin123
