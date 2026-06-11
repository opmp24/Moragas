# AGENTS.md

## Project Overview

**Moragas** — App de finanzas personales. Admin envía mensajes a un bot de Telegram → Gemini clasifica (ingreso/egreso, categoría, monto) → guarda en Supabase. Usuarios acceden vía clave única y ven dashboard con gráficos.
el agente debe responder siempre en español.

- Telegram bot: `@OkoViajero_bot`
- Supabase project: `yfdwtfricvquakrtarey`
- Gemini API key en `Docs/Keys.txt`

---

## Build / Lint / Test Commands

```bash
npm install              # instalar dependencias
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # TypeScript check + Vite build → dist/
npm run preview          # preview production build
npm run typecheck        # tsc --noEmit (solo frontend)
npm test                 # vitest run (tests unitarios)
npm run test:watch       # vitest watch mode
npm run test:cov         # vitest con cobertura
npm run test:e2e         # playwright test (E2E)
npm run test:e2e:ui      # playwright UI mode
```

## Testing

### Unit tests (Vitest)
- Framework: **Vitest** + **@testing-library/react** + **jsdom**
- Test files: `src/**/*.test.ts` o `src/**/__tests__/*.test.tsx`
- Single test: `npx vitest run src/lib/__tests__/api.test.ts`
- By pattern: `npx vitest run --grep="login"`
- Config: `vitest.config.ts` (jsdom, alias @/, globals: true)
- Siempre haz comprobaciones y test utilizando playwright

### E2E tests (Playwright)
- Framework: **@playwright/test** con Chromium
- Test files: `e2e/*.spec.ts`
- Single test: `npx playwright test e2e/login.spec.ts`
- UI mode: `npx playwright test --ui`
- Config: `playwright.config.ts` (arranca Vite automáticamente)

---

## Project Structure

```
Moragas/
├── src/                          # Frontend React
│   ├── pages/                    # Login, Dashboard, AdminPanel
│   ├── context/                  # AuthContext, ThemeContext
│   ├── components/Charts/        # MonthlyChart, CategoryChart (Recharts)
│   ├── lib/                      # supabase.ts, api.ts (Netlify Functions client)
│   └── types/                    # TypeScript interfaces
│   ├── __tests__/                 # Test unitarios (api)
│   └── pages/__tests__/           # Test unitarios (componentes)
├── e2e/                           # Test E2E con Playwright
├── netlify/functions/            # Netlify Functions (backend)
│   ├── login.ts                  # Validar clave, crear sesión
│   ├── logout.ts                 # Eliminar sesión
│   ├── me.ts                     # Validar token de sesión
│   ├── admin-create-key.ts       # Admin genera clave para usuario
│   ├── admin-revoke-key.ts       # Admin revoca acceso
│   ├── admin-list-keys.ts        # Listar todas las claves
│   ├── transactions.ts           # Consultar transacciones
│   ├── transactions-summary-*.ts # Resúmenes mensuales y por categoría
│   ├── telegram-webhook.ts       # Bot Telegram + Gemini AI
│   └── _shared.ts                # Utilidades compartidas (DB, auth, helpers)
├── supabase/migrations/          # SQL migrations
├── public/icons/                 # PWA icons (SVG)
├── shared/types.ts               # Tipos compartidos frontend/backend
├── vite.config.ts                # Vite + PWA plugin config
├── tailwind.config.ts            # Tailwind con colores personalizados
├── netlify.toml                  # Deploy config
├── .env.example                  # Variables de entorno
└── Docs/                         # Keys.txt (gitignored, local only)
```

---

## Architecture

### Auth Flow
1. Admin genera clave desde panel `/admin` → sistema genera clave aleatoria
2. Admin copia clave y la envía manualmente al usuario
3. Usuario ingresa clave en `/login` → se crea sesión en Supabase (`sessions` table)
4. Token se guarda en `localStorage` (`moragas-token`)
5. Admin puede revocar clave → sesión se invalida automáticamente
6. Clave maestra admin: `MoragasAdmin2024` (definida en `ADMIN_MASTER_KEY`)

### Telegram Bot Flow
1. Admin envía mensaje al bot → Telegram POST a `/.netlify/functions/telegram-webhook`
2. Se verifica que `from.id === ADMIN_TELEGRAM_ID`
3. Gemini clasifica: `{ type, amount, category, user_name, description }`
4. Se guarda en `transactions` table
5. Bot responde con confirmación: monto, categoría, tipo

### Auth System (sin OAuth)
- Tabla `access_keys`: key_hash, display_name, role (admin/user), is_active
- Tabla `sessions`: token, access_key_id, last_used_at
- Netlify Functions validan sesión contra Supabase (service_role key)
- Frontend nunca ve la service_role key ni las functions

---

## Database (Supabase)

### Tables
- `access_keys` — claves de acceso (hash, nombre, rol, activo)
- `sessions` — sesiones activas (token, FK a access_keys)
- `transactions` — transacciones financieras (tipo, monto, categoría, descripción)

### RPC Functions
- `get_monthly_summary()` — ingresos/gastos agrupados por mes
- `get_category_summary()` — gastos agrupados por categoría

---

## Environment Variables

| Variable | Dónde se usa |
|----------|-------------|
| `VITE_SUPABASE_URL` | Frontend (build + runtime) |
| `VITE_SUPABASE_ANON_KEY` | Frontend (build + runtime) |
| `SUPABASE_SERVICE_KEY` | Netlify Functions (solo runtime) |
| `TELEGRAM_BOT_TOKEN` | Netlify Functions |
| `ADMIN_TELEGRAM_ID` | Netlify Functions |
| `GEMINI_API_KEY` | Netlify Functions |
| `ADMIN_MASTER_KEY` | Netlify Functions (default: MoragasAdmin2024) |
| `PUBLIC_URL` | Dev/prod URL |

---

## Code Style

### Imports
- ES modules (`import`/`export`), no `require()`
- Orden: built-ins → terceros → internos → tipos (`import type`)
- No barrel files; importar directamente

### Formatting
- Single quotes, semicolons, trailing commas
- 2-space indent, 100 char width
- Sin Prettier configurado aún

### Types
- `strict: true` en tsconfig
- `interface` para objetos, `type` para uniones/alias
- Tipos compartidos en `shared/types.ts`
- Frontend re-exporta desde `src/types/index.ts`

### Naming
- Archivos: `kebab-case.ts`
- Funciones/vars: `camelCase`
- Componentes/classes: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Env vars: `UPPER_SNAKE_CASE`

### Error Handling
- Frontend: try/catch en llamadas API, mostrar error toast/inline
- Functions: `err(status, msg)` helper, validar token siempre
- Bot: try/catch Gemini + DB, responder error al admin, siempre return 200 a Telegram

### Security
- `Docs/` está en `.gitignore` — las keys nunca se suben
- `SUPABASE_SERVICE_KEY` solo en Netlify Functions (nunca en frontend)
- Sesiones se validan contra Supabase en cada request
- Admin revoca claves → sesiones se eliminan automáticamente

### Git
- Branch naming: `feat/`, `fix/`, `chore/`
- Conventional commits
- No commitear secrets ni `.env`
- no hacer commit o merge a la rama `main` sin solicitud explicita

---

## Deploy

1. Conectar repo `opmp24/Moragas` a Netlify
2. Configurar environment variables en Netlify Dashboard
3. Deploy automático desde `main`
4. Registrar webhook del bot:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<NETLIFY_URL>/.netlify/functions/telegram-webhook
   ```
5. Ejecutar migraciones SQL en Supabase Dashboard > SQL Editor
6. (Opcional) Ejecutar seed.sql para datos de ejemplo

---

## PWA

- `vite-plugin-pwa` con service worker
- Instalable en Android (manifest con icons SVG)
- Modo offline parcial (workbox precache)
