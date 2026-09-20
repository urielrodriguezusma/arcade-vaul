# SPEC 02 — Página Home y ruta /games

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-09-16
> **Objective:** Crear la página de inicio (`/`) replicando visualmente el prototipo `references/home-about/home.jsx`, moviendo el listado de juegos (Biblioteca) que hoy vive en `/` hacia una nueva ruta `/games`.

---

## Por qué existe este spec

SPEC 01 implementó la Biblioteca (grid de juegos) directamente en `/`. `references/home-about/` contiene un prototipo de landing page (Home) distinto, con hero, secciones de features, preview de juegos, actividad en vivo y precios, más una página About que queda fuera de este spec. Este spec traduce ese Home a Next.js, deja `/` para la landing y reubica la Biblioteca en `/games`.

---

## Scope

**In:**

- Nueva página `/` (Home) migrando `references/home-about/home.jsx`: hero con siluetas decorativas flotantes, sección "¿Por qué Arcade Vault?" (feature cards), sección "Juegos disponibles ahora" (preview de 6 juegos desde `GAMES`), sección de estadísticas, sección "Actividad en vivo" (últimas puntuaciones + top jugadores, datos decorativos hardcodeados), sección de precios (plan único + FAQ), CTA final. Animación de aparición al hacer scroll (`IntersectionObserver` sobre elementos `.reveal`), igual que el prototipo.
- Nueva ruta `/games`: recibe el contenido que hoy está en `app/page.tsx` (grid de juegos, búsqueda por título, chips de categoría, estado vacío "NO HAY RESULTADOS"), sin cambios de lógica ni de diseño respecto a lo ya implementado en SPEC 01.
- Nuevo componente `components/mini-card.tsx`: tarjeta simple (portada + título + categoría, sin efecto tilt) para la sección "Juegos disponibles ahora" del Home, distinto del `GameCard` existente.
- Actualización de `components/nav.tsx`: se agregan los links "Inicio" (→ `/`) y "Acerca de" (visual, sin `href` ni navegación funcional); el link "Biblioteca" pasa a apuntar a `/games`; "Salón de la Fama" no cambia. Esto aplica tanto al nav de escritorio como al panel móvil.
- CTAs del Home: "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/games`; las mini-cards de la sección de preview navegan a `/juegos/[id]` (ruta de detalle existente); "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`.
- Ajustes a `app/globals.css`: portar las clases del Home ausentes en el CSS actual (`references/home-about/styles.css` → `.home-*`, `.mini-*`, `.feature-*`, `.stat-*`, `.activity-*`, `.tick-*`, `.top-*`, `.pricing-*`, `.price-*`, `.faq-*`, etc.).

**Out of scope (for future specs):**

- Página `/about` y su formulario de contacto simulado (`references/home-about/about.jsx`). El link "Acerca de" del Nav queda visual, sin ruta ni funcionalidad.
- Renombrar las rutas existentes `/juegos/[id]` y `/juegos/[id]/jugar` a `/games/[id]` y `/games/[id]/jugar`. Se mantienen como están.
- Conectar los datos decorativos de "Actividad en vivo" o "Precios" a datos reales (`lib/data.ts`, `localStorage`). Siguen siendo arrays hardcodeados, igual que en el prototipo.
- Cualquier cambio a la lógica de Detalle, Reproductor, Salón o Auth ya implementada en SPEC 01.
- Tests automatizados (no hay test runner configurado en el proyecto).

---

## Data model

Este spec no introduce estructuras de datos nuevas. Reutiliza `Game` y `GAMES` de `lib/data.ts` (SPEC 01) para la sección "Juegos disponibles ahora" (`GAMES.slice(0, 6)`). Los arrays de "últimas puntuaciones", "top jugadores" y el plan de precios son literales decorativos definidos localmente dentro del componente Home, sin tipo exportado ni persistencia.

---

## Implementation plan

1. Mover el contenido actual de `app/page.tsx` (Biblioteca: búsqueda, chips de categoría, grid de `GameCard`, estado vacío) a `app/games/page.tsx`, sin modificar su lógica. Prueba manual: `npm run dev`, navegar a `/games` y confirmar que se ve y comporta igual que la Biblioteca actual en `/`.
2. Crear `components/mini-card.tsx` migrando el componente `MiniCard` de `home.jsx` (portada con `cover-bg` + clase de juego, título, categoría, `onClick` que navega a `/juegos/[id]`).
3. Reescribir `app/page.tsx` como la nueva Home (client component, ya que usa `useEffect` + `IntersectionObserver` para las animaciones `.reveal`): hero con siluetas SVG decorativas y CTAs ("EXPLORAR JUEGOS" → `/games`, "CREAR CUENTA" → `/auth`), sección de features, sección de preview con `GAMES.slice(0, 6)` y `MiniCard` (CTA "VER TODOS LOS JUEGOS →" → `/games`), sección de estadísticas, sección de actividad en vivo (ticker de puntuaciones + top jugadores, datos hardcodeados igual que el prototipo, link "VER SALÓN →" a `/salon`), sección de precios (CTA "EMPEZAR GRATIS →" → `/auth`) con FAQ, CTA final ("INSERTAR MONEDA →" → `/games`). Prueba manual: `npm run dev`, comparar visualmente `/` contra el prototipo.
4. Actualizar `components/nav.tsx`: agregar link "Inicio" (`<Link href="/">`, activo solo cuando `pathname === "/"`), cambiar el `href` del link "Biblioteca" a `/games` (activo cuando `pathname === "/games"` o `pathname.startsWith("/juegos")`), agregar "Acerca de" como texto no interactivo (sin `Link`, sin `onClick`) en el nav de escritorio y en el panel móvil. Prueba manual: navegar entre `/`, `/games` y `/salon` y confirmar que el link activo correspondiente se resalta; confirmar que "Acerca de" no navega a ningún lado.
5. Revisar `app/globals.css` contra `references/home-about/styles.css` y portar cualquier clase faltante usada por el Home y `MiniCard` (confirmado: ninguna de las clases `.home-*`, `.mini-*`, `.feature-*`, `.stat-*`, `.activity-*`, `.tick-*`, `.top-*`, `.pricing-*`, `.price-*` existe hoy en `app/globals.css`). Prueba manual: comparar visualmente el Home renderizado contra `references/home-about/arcade-vault-standalone.html` en el navegador, en desktop y en viewport móvil.
6. Revisión final: `npm run dev` y `npm run lint`, recorrer `/`, `/games`, `/salon`, `/auth` y confirmar que todos los CTAs y links del Nav apuntan a la ruta correcta.

---

## Acceptance criteria

- [ ] `npm run dev` levanta sin errores y `npm run lint` no reporta errores nuevos.
- [ ] `/` muestra la nueva página Home (hero, features, preview de juegos, estadísticas, actividad en vivo, precios, CTA final) con el mismo look & feel que `references/home-about/home.jsx`.
- [ ] `/games` muestra el grid de juegos con búsqueda y filtro por categoría, igual que antes cuando vivía en `/`.
- [ ] Las secciones del Home animan su aparición al hacer scroll (clase `.reveal` + `in`), igual que el prototipo.
- [ ] En el Home, "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/games`.
- [ ] En el Home, cada mini-card de "Juegos disponibles ahora" navega al detalle del juego correspondiente en `/juegos/[id]`.
- [ ] En el Home, "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`.
- [ ] En el Home, "VER SALÓN →" navega a `/salon`.
- [ ] El Nav muestra 4 links: "Inicio", "Biblioteca", "Salón de la Fama", "Acerca de".
- [ ] "Inicio" navega a `/` y se resalta como activo solo en `/`.
- [ ] "Biblioteca" navega a `/games` y se resalta como activo en `/games` y en las rutas `/juegos/*`.
- [ ] "Salón de la Fama" sigue navegando a `/salon` sin cambios de comportamiento.
- [ ] "Acerca de" es visible en el Nav (escritorio y panel móvil) pero no navega a ninguna ruta ni ejecuta ninguna acción al hacer click.
- [ ] En viewport móvil, el panel hamburguesa muestra los mismos 4 links con el mismo comportamiento (3 funcionales, 1 visual).

---

## Decisions

- **Sí:** mover la Biblioteca de `/` a `/games`, dejando `/` para la nueva Home. Razón: pedido explícito del usuario.
- **Sí:** mantener las rutas `/juegos/[id]` y `/juegos/[id]/jugar` sin cambios. Razón: evita tocar rutas ya implementadas y verificadas en SPEC 01; el usuario eligió esta opción sobre renombrarlas a `/games/[id]`.
- **Sí:** crear `MiniCard` como componente nuevo y separado de `GameCard`. Razón: fidelidad visual exacta al prototipo (el `MiniCard` del Home no tiene el efecto tilt del `GameCard` de la Biblioteca); decisión explícita del usuario.
- **Sí:** los datos de "Actividad en vivo" y "Precios" quedan hardcodeados y decorativos, sin relación con `lib/data.ts` ni `localStorage`. Razón: mismo enfoque de fidelidad visual sin lógica real usado en SPEC 01; decisión explícita del usuario.
- **Sí:** Nav con 4 links visibles, pero "Acerca de" sin ruta ni funcionalidad. Razón: `/about` queda fuera del alcance de este spec; el usuario prefirió mostrar el link igual que el prototipo en vez de ocultarlo.
- **No:** crear la página `/about` en este spec. Razón: decisión explícita del usuario de acotar el alcance a Home + `/games`; se implementará en un spec futuro.
- **No:** renombrar las rutas `/juegos/*` a `/games/*`. Razón: el usuario eligió la opción recomendada de no tocar rutas ya implementadas.

---

## Identified risks

- El Home requiere `IntersectionObserver` para las animaciones `.reveal`, por lo que `app/page.tsx` debe ser client component (`"use client"`); si se omite, las secciones no animarán al hacer scroll.
- Dejar "Acerca de" como texto sin `Link` puede generar confusión visual si no se le da un estilo claramente distinto (p. ej. sin cursor pointer, sin hover activo) al de los links funcionales; validar en la revisión visual del paso 6.

---

## What is **not** in this spec

- La página `/about` y su formulario de contacto simulado.
- Hacer funcional el link "Acerca de" del Nav.
- Renombrar `/juegos/[id]` y `/juegos/[id]/jugar` a `/games/[id]` y `/games/[id]/jugar`.
- Datos reales (no decorativos) para "Actividad en vivo" o "Precios".
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
