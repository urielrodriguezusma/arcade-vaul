# SPEC 03 — Integración base de Supabase

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-23
> **Objective:** Integrar Supabase en la app Next.js (clientes de navegador y servidor con `@supabase/ssr`, refresco de sesión en `proxy.ts` y variables de entorno) y verificar la conexión con una ruta de health-check, sin cambiar ninguna pantalla ni funcionalidad existente.

---

## Por qué existe este spec

SPEC 01 y SPEC 02 dejaron la app funcionando con datos simulados: sesión en `localStorage["av_user"]`, puntajes en `localStorage["av_scores"]` y leaderboards generados con `seededScores`. El proyecto Supabase (`igouhtxxscawvayrsrcn`) ya está conectado por MCP, pero la app no tiene ni el SDK ni la configuración. Este spec solo prepara la base técnica para que los specs siguientes (auth real, puntajes persistidos) puedan usar Supabase sin rehacer la integración.

---

## Scope

**In:**

- Instalar las dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`:
  - Valores reales en `.env.local` (obtenidos del proyecto conectado por MCP).
  - Placeholders (`xxxx`) en `.env.template`, siguiendo el formato actual del archivo.
- `lib/supabase/client.ts`: función `createClient()` que usa `createBrowserClient` de `@supabase/ssr`, para client components.
- `lib/supabase/server.ts`: función async `createClient()` que usa `createServerClient` de `@supabase/ssr` con `cookies()` de `next/headers`, para server components, server actions y route handlers.
- `lib/supabase/proxy.ts`: función `updateSession(request)` que crea un server client ligado a las cookies de la request/response y refresca la sesión.
- `proxy.ts` en la raíz del repo (convención de Next.js 16, antes `middleware.ts`) que llama a `updateSession` con un `matcher` que excluye estáticos (`_next/static`, `_next/image`, `favicon.ico` e imágenes).
- Ruta interna `app/api/health/supabase/route.ts` (`GET`) que comprueba la conexión y responde JSON: `{ ok: true }` con status 200, o `{ ok: false, error: string }` con status 500.

**Out of scope (for future specs):**

- Autenticación real con Supabase Auth: `components/user-provider.tsx` y `/auth` siguen simulados con `localStorage["av_user"]`.
- Tablas, migraciones o RLS. El esquema `public` queda vacío.
- Persistir puntajes o leaderboards en Supabase (`av_scores` y `seededScores` no cambian).
- Mover el catálogo `GAMES` de `lib/data.ts` a la base de datos.
- Tipos generados de la base de datos (`database.types.ts`), porque todavía no hay esquema.
- Uso de la `service_role` key o de clientes con privilegios de administrador.
- Cambios visuales en cualquier pantalla.
- Tests automatizados (no hay test runner configurado en el proyecto).

---

## Data model

Este spec no introduce estructuras de datos ni tablas. Solo agrega configuración:

```bash
# .env.local (valores reales) / .env.template (placeholders "xxxx")
NEXT_PUBLIC_SUPABASE_URL=https://<project_ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

```ts
// lib/supabase/client.ts
export function createClient(): SupabaseClient;

// lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient>;

// lib/supabase/proxy.ts
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse>;

// app/api/health/supabase/route.ts → respuesta JSON
type HealthResponse = { ok: true } | { ok: false; error: string };
```

---

## Implementation plan

1. Leer `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` y la referencia de la convención `proxy` antes de escribir código (lo pide `AGENTS.md`). Instalar `@supabase/supabase-js` y `@supabase/ssr` con `npm install`. Prueba manual: `npm run dev` sigue levantando sin errores.
2. Obtener la URL y la publishable key del proyecto con las herramientas MCP de Supabase (`get_project_url`, `get_publishable_keys`) y agregarlas a `.env.local`. Agregar las dos claves con valor `xxxx` a `.env.template`. No tocar las variables existentes (`RESEND_*`, `CONTACT_*`, `SUPABASE_DB_Password`).
3. Crear `lib/supabase/client.ts` con `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)`.
4. Crear `lib/supabase/server.ts` con `createServerClient` y el adaptador de cookies (`getAll`/`setAll`) sobre `await cookies()`. `setAll` va dentro de `try/catch` porque falla si se llama desde un server component; en ese caso el refresco lo hace el proxy.
5. Crear `lib/supabase/proxy.ts` con `updateSession(request)`, que crea un server client ligado a `request.cookies` y a un `NextResponse.next({ request })`, llama a `supabase.auth.getClaims()` para refrescar el token y devuelve la response con las cookies actualizadas. No redirige a nadie: no hay rutas protegidas en este spec.
6. Crear `proxy.ts` en la raíz que exporta `proxy(request)` llamando a `updateSession`, y el `config.matcher` que excluye estáticos. Prueba manual: navegar `/`, `/games`, `/juegos/[id]`, `/salon`, `/auth` y `/about` y confirmar que todo se ve y funciona igual que antes.
7. Crear `app/api/health/supabase/route.ts`: instancia el server client de `lib/supabase/server.ts` (valida que las env vars y las cookies funcionan) y hace `fetch` a `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health` con el header `apikey` igual a la publishable key. Si la respuesta es 2xx devuelve `{ ok: true }` (200); en cualquier otro caso, o si faltan env vars o hay excepción, devuelve `{ ok: false, error }` (500). Prueba manual: `GET http://localhost:3000/api/health/supabase` responde `{ "ok": true }`.
8. Revisión final: `npm run lint` y `npm run build` sin errores nuevos. Confirmar con `git status` que `.env.local` no aparece como archivo a commitear.

---

## Acceptance criteria

- [ ] `package.json` tiene `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`.
- [ ] `.env.local` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los valores del proyecto `igouhtxxscawvayrsrcn`.
- [ ] `.env.template` tiene las mismas dos claves con valor `xxxx`, y conserva las claves que ya tenía.
- [ ] Existen `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts` y `proxy.ts` en la raíz.
- [ ] No existe `middleware.ts` en el repo.
- [ ] `GET /api/health/supabase` responde `200` con `{ "ok": true }` con las env vars correctas.
- [ ] Con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` inválida, `GET /api/health/supabase` responde `500` con `{ "ok": false, "error": ... }`.
- [ ] `/`, `/games`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/auth` y `/about` cargan y se comportan igual que antes del spec (la auth simulada y `av_scores` siguen funcionando).
- [ ] `npm run lint` y `npm run build` terminan sin errores nuevos.
- [ ] `.env.local` no aparece en `git status` como archivo nuevo o modificado a commitear.
- [ ] Ningún archivo del repo contiene la `service_role` key.

---

## Decisions

- **Sí:** limitar el spec a la integración, sin auth real, tablas ni puntajes. Razón: pedido explícito del usuario ("solo necesito la integración con supabase"); cada funcionalidad sobre Supabase va en su propio spec.
- **Sí:** `@supabase/ssr` con tres clientes (browser, server y proxy) en vez de un único cliente de `supabase-js`. Razón: es el patrón oficial para Next.js App Router y deja la sesión por cookies lista para el spec de auth, sin rehacer la integración.
- **Sí:** `proxy.ts` en vez de `middleware.ts`. Razón: desde Next.js 16, Middleware se llama Proxy (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`).
- **Sí:** refrescar el token con `supabase.auth.getClaims()` en el proxy, sin redirecciones. Razón: no hay rutas protegidas todavía; el proxy solo mantiene las cookies de sesión al día.
- **Sí:** verificar la conexión con la ruta `app/api/health/supabase/route.ts` que consulta `/auth/v1/health`. Razón: el esquema `public` está vacío, así que no hay tabla que consultar; el endpoint de health de Auth confirma que la URL y la key son válidas sin crear esquema.
- **Sí:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_...`) en vez de la `anon` key antigua. Razón: es el formato actual recomendado por Supabase.
- **No:** usar la `service_role` key. Razón: ninguna operación de este spec necesita privilegios de administrador y exponerla sería un riesgo.
- **No:** generar tipos de base de datos. Razón: sin tablas, los tipos quedarían vacíos; se generan en el primer spec que cree esquema.

---

## Identified risks

- `.gitignore` incluye la regla `.env*` y lista `.env.template` explícitamente, así que los cambios en `.env.template` no se versionan. Este spec no cambia `.gitignore`; si se quiere versionar el template, hace falta un ajuste aparte.
- El proxy se ejecuta en casi todas las requests. Un `matcher` mal escrito podría interceptar estáticos y degradar el rendimiento, o tocar rutas que no debería. Hay que validarlo en el paso 6.
- Si faltan las env vars (por ejemplo, en un deploy), el proxy puede lanzar una excepción y romper todas las rutas. `updateSession` debe comprobar que existen y, si faltan, devolver `NextResponse.next()` sin crear el cliente.

---

## What is **not** in this spec

- Autenticación real (email/contraseña u OAuth) con Supabase Auth.
- Tablas, migraciones, RLS o tipos generados.
- Persistencia de puntajes y leaderboards en Supabase.
- Catálogo de juegos en base de datos.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
