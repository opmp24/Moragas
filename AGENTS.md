# AGENTS.md

## Project Overview

**Moragas** — App de finanzas personales. Admin envía mensajes a un bot de Telegram → Gemini clasifica (ingreso/egreso, categoría, monto) → guarda en Supabase. Usuarios acceden vía clave única y ven dashboard con gráficos.
el agente debe responder siempre en español neutro.

- Telegram bot: `@OkoViajero_bot`
- Supabase project: `yfdwtfricvquakrtarey`
- Gemini API key en `Docs/Keys.txt`
- si necesitas mas claves buscalas en el archivo .txt de la carpeta /docs

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
│   ├── lib/                      # supabase.ts, api.ts ( Functions client)
│   └── types/                    # TypeScript interfaces
│   ├── __tests__/                 # Test unitarios (api)
│   └── pages/__tests__/           # Test unitarios (componentes)
├── e2e/                           # Test E2E con Playwright
├── supabase/functions/           # Supabase Edge Functions (backend)
│   └── telegram-webhook/         # Bot Telegram + Gemini AI
├── /functions/                   #  Functions (vacio, migrado a Edge)
├── supabase/migrations/          # SQL migrations
├── public/icons/                 # PWA icons (SVG)
├── shared/types.ts               # Tipos compartidos frontend/backend
├── vite.config.ts                # Vite + PWA plugin config
├── tailwind.config.ts            # Tailwind con colores personalizados

├── .env.example                  # Variables de entorno
└── Docs/                         # Keys.txt (gitignored, local only)
```
en supabase/config.toml # las funciones para la BBDD aqui
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
1. Admin envía mensaje al bot → Telegram POST a `https://yfdwtfricvquakrtarey.supabase.co/functions/v1/telegram-webhook`
2. Se verifica que `from.id === ADMIN_TELEGRAM_ID`
3. Gemini clasifica: `{ type, amount, category, user_name, description }`
4. Se guarda en `transactions` table mediante RPC `bot_insert_transaction`
5. Bot responde con confirmación: monto, categoría, tipo

### Auth System (sin OAuth)
- Tabla `access_keys`: key_hash, display_name, role (admin/user), is_active
- Tabla `sessions`: token, access_key_id, last_used_at
- Backend via Supabase RPCs + service_role key, no hay servidor intermedio
- Frontend nunca ve la service_role key

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
| `SUPABASE_SERVICE_KEY` |  Functions (solo runtime) |
| `TELEGRAM_BOT_TOKEN` |  Functions |
| `ADMIN_TELEGRAM_ID` |  Functions |
| `GEMINI_API_KEY` |  Functions |
| `ADMIN_MASTER_KEY` |  Functions (default: MoragasAdmin2024) |
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
- `SUPABASE_SERVICE_KEY` solo en  Functions (nunca en frontend)
- Sesiones se validan contra Supabase en cada request
- Admin revoca claves → sesiones se eliminan automáticamente

### Git
- Branch naming: `feat/`, `fix/`, `chore/`
- Conventional commits
- No commitear secrets ni `.env`
- no hacer commit o merge a la rama `main` sin solicitud explicita

---

## Deploy

1. Conectar repo `opmp24/Moragas` 
2. Configurar environment variables 
3. Deploy automático desde `main`
4. Ejecutar migraciones SQL en Supabase Dashboard > SQL Editor
5. (Opcional) Ejecutar seed.sql para datos de ejemplo
6. Deploy Edge Function del bot:
   ```bash
   supabase functions deploy telegram-webhook --no-verify-jwt
   supabase secrets set TELEGRAM_BOT_TOKEN=... ADMIN_TELEGRAM_ID=... GEMINI_API_KEY=...
   ```
7. Registrar webhook del bot (solo una vez):
   ```
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yfdwtfricvquakrtarey.supabase.co/functions/v1/telegram-webhook"
   ```

---

## Gemini API — Cuota Free Tier

- Proyecto GCP `912408221896` — cuota diaria: **1,500 requests/día**, por minuto: **60 requests/min**
- **No hacer más de 2 llamadas de prueba a Gemini por sesión** sin verificar el resultado y sin continuar acumulando hasta agotar la cuota
- Preferir probar el flujo completo enviando un solo mensaje desde Telegram, en vez de curls directos a Gemini
- La cuota es **por proyecto GCP**, no por API key — cambiar la key no renueva la cuota
- Si se agota la cuota diaria, esperar ~24h al reset

---

## PWA

- `vite-plugin-pwa` con service worker
- Instalable en Android (manifest con icons SVG)
- Modo offline parcial (workbox precache)

---

## Subagentes

### @DatabaseExpert

**Rol:** Administrador de Base de Datos Senior (PostgreSQL / Supabase).

**Capacidades del Entorno (Crítico):**
- Tienes acceso exclusivo al **CLI de Supabase** instalado de forma global.
- Debes gestionar el ciclo de vida de la base de datos local utilizando comandos como `supabase start`, `supabase db diff` y `supabase migration new`.

**Reglas de Actuación:**
1. **Siempre local primero:** Antes de proponer un cambio en las tablas, usa el CLI para verificar el estado de las migraciones locales.
2. **Generación de Tipos:** Cada vez que modifiques la estructura de la base de datos, ejecuta el comando de Supabase para regenerar los tipos de TypeScript y repórtalos al Agente Principal.
3. **Restricción:** No inventes esquemas sin antes haber mapeado las tablas existentes con el CLI.

### @ReactExpert

**Rol:** Arquitecto Frontend Senior (React 19 + TypeScript + Tailwind).

**Principios:**
- Componentes pequeños, responsabilidad única, composición sobre herencia.
- Estados explícitos: loading, empty, error, success — cubrir siempre los 4.
- Props tipadas con TypeScript, evitar `any`.
- Hooks personalizados para lógica reusable, effects con dependencias explícitas.

**Rendimiento:**
- `useMemo`/`useCallback` solo para cálculos costosos o referencias estables.
- Mover estado al componente que lo necesita, evitar renders innecesarios.
- Lazy loading con `React.lazy` + Suspense para rutas pesadas.

**Estilo:**
- Tailwind utility classes, CSS variables para theming dinámico.
- Diseño responsive mobile-first.

**Testing:**
- Tests unitarios con Vitest + Testing Library (comportamiento, no implementación).
- Tests E2E con Playwright para flujos críticos (login, dashboard, movements).
- Preferir queries por rol/texto/aria, usar `data-testid` solo como último recurso.

**Seguridad:**
- No exponer tokens ni secrets en el frontend.
- Validar inputs aunque vengan del backend.

### @QATester

**Rol:** Ingeniero de Calidad Senior (Testing y Usabilidad).

**Enfoque:** Validar que todo funcione correctamente desde la perspectiva del usuario. Pruebas de caja negra, flujos completos, casos borde.

**Herramientas:**
- **Vitest** + **Testing Library** para unit tests
- **Playwright** para E2E (login, dashboard, movements, admin)
- Pruebas manuales de usabilidad y flujo

**Reglas de Actuación:**
1. **Cubrir los 4 estados:** loading, empty, error, success — siempre.
2. **Priorizar flujos críticos:** login → dashboard → movements → admin. Si algo falla ahí, bloquea.
3. **Caja negra:** Probar como usuario, no como implementación. No usar `data-testid` salvo que no haya otra forma.
4. **Casos borde:** inputs vacíos, fechas inválidas, valores negativos, caracteres especiales.
5. **Playwright primero:** Para cualquier cambio o feature nueva, primero verificar que los E2E tests existentes pasan, después escribir los nuevos.
6. **Reportar:** Si un test falla, decir exactamente qué se esperaba vs qué pasó y dónde.
