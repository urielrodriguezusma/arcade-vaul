# SPEC 01 — MVP visual de las 5 pantallas de Arcade Vault

> **Status:** Approved
> **Depends on:** ninguna
> **Date:** 2026-09-16
> **Objective:** Implementar en Next.js App Router las 5 pantallas visuales de Arcade Vault (Biblioteca, Detalle, Reproductor, Salón de la Fama, Auth) replicando el prototipo estático en `references/templates/`, sin lógica de juego real.

---

## Por qué existe este spec

`references/templates/` contiene un prototipo funcional en React puro (sin build, cargado vía CDN) con router propio basado en `location.hash`. Este spec traduce ese prototipo a las convenciones reales de Next.js App Router (rutas de archivo, componentes cliente/servidor, alias `@/*`) manteniendo el mismo look & feel, textos en español y comportamiento simulado (auth falsa, puntajes mock, "juego" con puntaje autoincremental decorativo).

---

## Scope

**In:**

- 5 rutas reales de Next.js:
  - `/` → Biblioteca (grid de juegos, búsqueda, filtro por categoría).
  - `/juegos/[id]` → Detalle del juego (info, tabla de mejores puntuaciones, botón jugar).
  - `/juegos/[id]/jugar` → Reproductor (HUD simulado, arena decorativa, pausa, modal de fin de juego).
  - `/salon` → Salón de la Fama (podio + tabla por juego, tabs por juego).
  - `/auth` → Inicio de sesión / registro (formulario simulado, invitado, botones sociales decorativos).
- `components/nav.tsx`: navegación global (desktop + menú móvil hamburguesa) montada en `app/layout.tsx`, con estado activo según la ruta actual (`usePathname`).
- Sesión de usuario simulada vía Context de React (`components/user-provider.tsx`), persistida en `localStorage` bajo la clave `av_user`, disponible en toda la app desde el layout raíz.
- Guardado de puntaje simulado en el Reproductor, persistido en `localStorage` bajo la clave `av_scores` (write-only, igual que el template: no se vuelve a leer en ninguna pantalla).
- Datos mock tipados en `lib/data.ts` (juegos, categorías, generador determinista de tablas de puntuación) migrados desde `references/templates/data.jsx`.
- Fidelidad visual y de textos (español) al prototipo: mismas clases de diseño, mismos estados (vacío en búsqueda, pausa, fin de juego, guardado de puntaje), mismo comportamiento responsive (menú hamburguesa en móvil).
- Ajustes puntuales a `app/globals.css` si falta alguna clase presente en `references/templates/styles.css` y ausente en el CSS actual del proyecto.

**Out of scope (for future specs):**

- Lógica real de cualquier juego (Bloque Buster, Caída, Serpentina, etc.). El Reproductor solo simula un puntaje que sube solo, no hay mecánica jugable.
- Autenticación real (backend, validación de credenciales, OAuth con Google/GitHub). Los botones sociales quedan decorativos y no funcionales.
- Persistencia real de leaderboards (backend, base de datos). Las tablas de puntuación siguen siendo generadas con la función determinista `seededScores`.
- Sistema de créditos/monedas funcional (el contador "CRÉDITOS · 03" del Nav es decorativo, igual que en el template).
- Tests automatizados (no hay test runner configurado en el proyecto).

---

## Data model

```ts
// lib/data.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // clase CSS del fondo de portada, p.ej. "cover-bricks"
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string; // p.ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/YYYY"
}

export const GAMES: Game[];
export const CATS: readonly ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
export function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// components/user-provider.tsx
interface User {
  name: string;
}
// Context expone: { user: User | null, login(u: User | null): void, logout(): void }
// login/logout persisten y borran la clave localStorage "av_user".
```

Convenciones:

- Los datos de juegos son estáticos en código (no vienen de una API ni base de datos).
- `seededScores(seed, count)` es determinista: mismo `seed` produce siempre la misma tabla (usa un PRNG lineal simple, igual que el template).
- `av_scores` en `localStorage` es un array de `{ game: string, score: number, name: string, at: number }`, solo se agrega (push), nunca se lee de vuelta en esta versión.

---

## Implementation plan

1. Crear `lib/data.ts` con los tipos `Game`/`ScoreRow`, migrando `GAMES`, `CATS` y `seededScores` desde `references/templates/data.jsx` a TypeScript (sin colgar nada de `window`). Prueba manual: `npx tsc --noEmit` no reporta errores en el archivo.
2. Crear `components/user-provider.tsx` (client component) con Context de sesión (`user`, `login`, `logout`) respaldado por `localStorage["av_user"]`, y envolver `{children}` con él en `app/layout.tsx`.
3. Crear `components/nav.tsx` (client component) migrando `nav.jsx`: usar `usePathname()` de `next/navigation` para el estado activo, `<Link>` de `next/link` para navegar, consumir el contexto de usuario para mostrar "Iniciar Sesión" o el nombre del usuario. Montarlo en `app/layout.tsx` antes de `{children}`.
4. Crear `components/game-card.tsx` migrando la tarjeta de juego de `biblioteca.jsx` (incluye el efecto tilt con `onMouseMove`).
5. Reescribir `app/page.tsx` como la pantalla Biblioteca (`/`): búsqueda, chips de categoría, grid de `GameCard`, estado vacío "NO HAY RESULTADOS". Cada `GameCard` enlaza a `/juegos/[id]`. Prueba manual: `npm run dev`, buscar un juego y filtrar por categoría.
6. Crear `app/juegos/[id]/page.tsx` migrando `detalle.jsx`: portada, info, tags, tabla de mejores puntuaciones (`seededScores`), botón "JUGAR AHORA" enlazando a `/juegos/[id]/jugar`. Si el `id` no existe en `GAMES`, usar `notFound()` de Next.js. Prueba manual: navegar desde la Biblioteca a un juego.
7. Crear `app/juegos/[id]/jugar/page.tsx` migrando `reproductor.jsx` (client component): HUD, arena decorativa, `setInterval` que incrementa el puntaje simulado, pausa, botón "FIN", modal de fin de juego con guardado de puntaje en `localStorage["av_scores"]`. Prueba manual: jugar, pausar, terminar, guardar puntaje, reiniciar.
8. Crear `app/salon/page.tsx` migrando `salon.jsx`: tabs por juego, podio (top 3), tabla completa, fila "tu mejor marca" cuando hay sesión iniciada. Prueba manual: cambiar de tab, iniciar sesión y ver la fila destacada.
9. Crear `app/auth/page.tsx` migrando `auth.jsx`: tabs "Iniciar sesión"/"Crear cuenta", formulario simulado que llama a `login()` del contexto y redirige a `/`, botón "jugar como invitado" (`login(null)`), botones sociales decorativos. Prueba manual: iniciar sesión con cualquier dato y ver el Nav actualizado.
10. Revisar `app/globals.css` contra `references/templates/styles.css` y portar cualquier clase faltante usada por los componentes migrados (p. ej. `.av-mobile-panel`, `.podium-slot`, `.crt`, `.modal-bd`). Prueba manual: comparar visualmente cada pantalla contra el HTML de referencia (`references/templates/Arcade Vault.html`) en el navegador.
11. Actualizar `app/page.tsx` original (hero placeholder) — su contenido se reemplaza por la Biblioteca en el paso 5, así que este paso es solo confirmar que no queda contenido duplicado del scaffold anterior.

---

## Acceptance criteria

- [ ] `npm run dev` levanta sin errores y `npm run lint` no reporta errores nuevos.
- [ ] `/` muestra el grid de juegos, la búsqueda filtra por título y los chips filtran por categoría.
- [ ] Buscar un texto sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Click en una tarjeta de juego navega a `/juegos/[id]` con la info y el leaderboard de ese juego.
- [ ] Navegar a `/juegos/id-inexistente` muestra la página 404 de Next.js.
- [ ] Botón "JUGAR AHORA" navega a `/juegos/[id]/jugar`.
- [ ] En el Reproductor, el puntaje sube solo cada ~220ms mientras no está en pausa ni terminado.
- [ ] Botón "PAUSA" detiene el incremento de puntaje y muestra el overlay "EN PAUSA"; "REANUDAR" lo retoma.
- [ ] Botón "FIN" abre el modal de fin de juego con el puntaje final.
- [ ] Guardar el puntaje en el modal escribe una entrada en `localStorage["av_scores"]` y muestra el toast "PUNTUACIÓN GUARDADA_".
- [ ] `/salon` muestra podio y tabla por juego seleccionado; cambiar de tab cambia los datos mostrados.
- [ ] Con sesión iniciada, `/salon` muestra la fila "TU MEJOR MARCA EN [JUEGO]"; sin sesión, no aparece.
- [ ] En `/auth`, enviar el formulario (cualquier dato) inicia sesión, guarda `localStorage["av_user"]` y redirige a `/`.
- [ ] "JUGAR COMO INVITADO" navega a `/` sin sesión iniciada.
- [ ] El Nav muestra "Iniciar Sesión" sin sesión y el nombre de usuario con sesión iniciada, en todas las rutas.
- [ ] El link activo del Nav se resalta según la ruta actual (`/` y sus subrutas de juego resaltan "Biblioteca").
- [ ] En viewport móvil, el botón hamburguesa abre el panel lateral con los mismos links.
- [ ] Recargar la página tras iniciar sesión mantiene la sesión (persistida en `localStorage`).

---

## Decisions

- **Sí:** rutas reales de Next.js App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/auth`) en vez de replicar el router hash-based del template. Razón: el proyecto exige seguir las convenciones de App Router; un router propio iría contra `AGENTS.md`.
- **Sí:** réplica fiel del Reproductor incluyendo el puntaje autoincremental simulado. Razón: es decorativo/visual, no lógica de juego real, y mantiene la fidelidad del MVP al prototipo.
- **Sí:** `localStorage` para sesión de usuario (`av_user`) y puntajes guardados (`av_scores`), igual que el template. Razón: no hay backend en este MVP; es lo mínimo para que la sesión sobreviva a un refresh.
- **Sí:** datos de juegos y leaderboards mock hardcodeados en `lib/data.ts`. Razón: no hay base de datos en este MVP; coincide con el scope "solo la parte visual".
- **Sí:** auth simulada — cualquier usuario/contraseña inicia sesión, botones sociales decorativos sin funcionalidad. Razón: no hay backend de auth en este MVP.
- **Sí:** Context de React (`user-provider.tsx`) para la sesión, en vez de estado local en cada página. Razón: el template centralizaba `user` en el componente `App`; en App Router no existe ese componente único, así que un Context en el layout raíz es el equivalente idiomático.
- **Sí:** Nav como client component montado una sola vez en `app/layout.tsx`. Razón: aparece en las 5 pantallas con estado activo dependiente de la ruta; evita duplicación.
- **No:** IndexedDB u otro almacenamiento más complejo. Razón: sobreingeniería para datos tan simples (nombre de usuario, lista corta de puntajes).
- **No:** proteger rutas o redirigir si no hay sesión. Razón: el template permite navegar todo sin iniciar sesión (modo invitado); este MVP mantiene ese comportamiento.

---

## What is **not** in this spec

- Cualquier juego jugable de verdad (mecánica, colisiones, niveles reales).
- Autenticación real con backend, validación o proveedores OAuth funcionales.
- Persistencia de leaderboards en un servidor o base de datos.
- Sistema de créditos/monedas funcional.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
