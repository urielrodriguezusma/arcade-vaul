# SPEC 04 — Juego de asteroides jugable en "ROCAS"

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-24
> **Objective:** Portar el juego de asteroides de `references/started-games/02-asteroids/` a un módulo TypeScript que se ejecute dentro del reproductor `/juegos/rocas/jugar`, conectado al HUD, la pausa y el modal de fin de partida existentes, mientras los demás juegos siguen con la arena simulada.

---

## Por qué existe este spec

SPEC 01 dejó el reproductor (`app/juegos/[id]/jugar/page.tsx`) con una arena decorativa y un puntaje falso que sube con `setInterval`. `references/started-games/02-asteroids/` tiene un Asteroids completo en canvas puro (`game.js`, un solo archivo con globals, listeners en `window` y HUD dibujado en canvas). No se puede pegar tal cual en Next.js: los globals y listeners sobrevivirían al salir de la ruta, y el HUD quedaría duplicado con el de la plataforma. Este spec convierte ese juego en un motor aislado con ciclo de vida (crear, pausar, destruir) y lo conecta a la entrada `rocas` del catálogo, que ya describe un juego de asteroides. También deja un registro `id → componente` para que los próximos juegos (`03-tetris`, `04-arkanoid`) se integren igual.

---

## Scope

**In:**

- `games/asteroids/engine.ts`: port a TypeScript de `game.js` sin React. Expone `createAsteroidsGame(canvas, callbacks)`, que devuelve `{ pause, resume, destroy }`. Sin variables globales de módulo: todo el estado vive dentro de la instancia.
- Mecánicas idénticas al original: rotación, empuje y rozamiento de la nave; espacio toroidal; asteroides de tamaño 3/2/1 que se dividen; puntos 20/50/100; 3 vidas; 2 s de espera tras morir; 3 s de invencibilidad con parpadeo al reaparecer; power-up de triple disparo (15% de probabilidad, garantizado a las 5 destrucciones, 5 s de duración, 12 s de vida); niveles con `3 + nivel` asteroides; `dt` limitado a 50 ms.
- Mundo lógico fijo de 800×600. El canvas ocupa todo el `.crt-screen` (que ya es 4:3), se escala por CSS y ajusta su resolución interna a `devicePixelRatio` para verse nítido.
- Paleta neón de la plataforma en lugar de blanco y negro: nave amarilla (`--yellow`, color de `rocas`), asteroides cian (`--cyan`), balas y llama del propulsor magenta (`--magenta`), power-up verde (`--green`), partículas cian que se desvanecen, y brillo con `shadowBlur`. Solo cambian los colores; formas y mecánicas no.
- Se eliminan del canvas el HUD de puntaje, nivel y vidas y el overlay "GAME OVER / ESPACIO PARA REINICIAR". En el canvas solo queda el indicador del triple disparo (`3x  N.Ns`).
- El motor informa `onStats({ score, lives, level })` cada vez que cambia algún valor, y `onGameOver(score)` una sola vez cuando se pierde la última vida.
- Entrada de teclado: `←` `→` rotan, `↑` empuja, `Espacio` dispara. Mientras el juego está montado, esas teclas llaman a `preventDefault()` para no hacer scroll, salvo cuando el foco está en un `input`/`textarea` (el campo de iniciales del modal). Al pausar, las teclas mantenidas se liberan.
- `components/games/asteroids-game.tsx` (client component): monta el `<canvas>`, crea el motor en `useEffect` y lo destruye en el cleanup (cancela `requestAnimationFrame` y quita listeners). Recibe la prop `paused` y llama a `pause()`/`resume()` según su valor. Escucha `P` y `Escape` para pedir el cambio de pausa, y `visibilitychange` (pestaña oculta) para pedir la pausa automática.
- `games/registry.ts`: mapa `GAME_COMPONENTS` de id de juego a componente jugable. Solo contiene `rocas → AsteroidsGame`.
- `app/juegos/[id]/jugar/page.tsx`:
  - Si `GAME_COMPONENTS[game.id]` existe, se renderiza ese componente dentro de `.crt-screen` en lugar de `.game-arena`, y se desactiva el `setInterval` de puntaje falso.
  - HUD: puntuación, vidas y nivel salen de `onStats`. El nivel es el nivel real del juego, no `score / 2500`.
  - Botón PAUSA/REANUDAR, `P`/`Esc` y la pausa automática comparten el mismo estado `paused`. El overlay "EN PAUSA" existente se muestra encima del canvas.
  - `onGameOver` abre el modal "FIN DEL JUEGO" con el puntaje real. El botón FIN también abre el modal y congela el motor (`paused` es `true` mientras `over` es `true`).
  - "JUGAR DE NUEVO" reinicia remontando el componente con una `key` nueva (`runId`), lo que destruye el motor anterior y crea uno nuevo.
  - "GUARDAR PUNTUACIÓN" sigue usando el `saveScore` actual sobre `localStorage["av_scores"]`, con el puntaje real.
  - Leyenda de controles bajo el CRT, solo para juegos reales: `← → ROTAR · ↑ PROPULSAR · ESPACIO DISPARAR · P PAUSA`.
- Los otros 7 juegos (`id` sin entrada en `GAME_COMPONENTS`) mantienen la arena simulada y el puntaje falso exactamente como hoy.
- `app/globals.css`: clases mínimas para el canvas (`.game-canvas`: `position:absolute; inset:0; width:100%; height:100%; display:block`) y la leyenda de controles (`.player-controls`), con los tokens existentes.

**Out of scope (for future specs):**

- Persistir puntajes en Supabase o conectar el Salón de la Fama a puntajes reales. Se sigue usando `localStorage["av_scores"]`.
- Controles táctiles o soporte de gamepad.
- Portar `03-tetris` y `04-arkanoid` (usarán el mismo registro, cada uno en su propio spec).
- Cambiar textos, portada, `best` o `plays` de `rocas` en `lib/data.ts`, y agregar un id `asteroids` al catálogo.
- Cambiar mecánicas: OVNIs (mencionados en la descripción de `rocas`), sonido, nuevos power-ups o ajustes de dificultad.
- Tocar la página de detalle `/juegos/[id]` o cualquier otra ruta.
- Arreglar el `notFound()` que hoy se llama antes de los hooks en la página de juego (no cambia el comportamiento de este spec).
- Tests automatizados (no hay test runner configurado en el proyecto).

---

## Data model

No hay datos persistidos nuevos. El formato de `localStorage["av_scores"]` (`{ game, score, name, at }`) no cambia. Solo se agregan tipos del motor y del registro:

```ts
// games/asteroids/engine.ts
export interface AsteroidsStats {
  score: number;
  lives: number; // 3 → 0
  level: number; // empieza en 1
}

export interface AsteroidsCallbacks {
  onStats: (stats: AsteroidsStats) => void;
  onGameOver: (finalScore: number) => void;
}

export interface AsteroidsGame {
  pause: () => void;
  resume: () => void; // reinicia el cálculo de dt para evitar saltos
  destroy: () => void; // cancela rAF y quita todos los listeners
}

export function createAsteroidsGame(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsGame;

// Estado interno de la instancia (no exportado), igual que el original:
// state: "playing" | "dead" | "gameover"
// ship, bullets, asteroids, particles, powerUps, score, lives, level,
// deadTimer, powerUpSpawned, killsSinceSpawn, keys, justPressed
```

```ts
// games/registry.ts
export interface PlayableGameProps {
  paused: boolean;
  onStats: (stats: { score: number; lives: number; level: number }) => void;
  onGameOver: (finalScore: number) => void;
  onTogglePause: () => void; // teclas P / Escape
  onAutoPause: () => void; // pestaña oculta
}

export const GAME_COMPONENTS: Partial<
  Record<string, ComponentType<PlayableGameProps>>
> = {
  rocas: AsteroidsGame,
};
```

---

## Implementation plan

1. Leer en `node_modules/next/dist/docs/` las guías de Server y Client Components y de `use`/params en páginas dinámicas antes de escribir código (lo pide `AGENTS.md`). Prueba manual: `npm run dev` levanta sin errores.
2. Crear `games/asteroids/engine.ts` portando `game.js` a TypeScript: clases `Bullet`, `Asteroid`, `PowerUp`, `Ship` y `Particle`, que reciben el `ctx` en `draw` en vez de usar un global. Todo el estado va dentro del closure de `createAsteroidsGame`. Listeners de `keydown`/`keyup` en `window`, con `preventDefault` en flechas y Espacio salvo si el foco está en `input`/`textarea`. Loop con `requestAnimationFrame` y `dt` limitado a 50 ms. Sin HUD ni overlay de game over en canvas, salvo el indicador `3x`. Paleta neón con una constante `COLORS` que replica los tokens de `globals.css`. Escalado: canvas interno `800·dpr × 600·dpr` con `ctx.setTransform(dpr, …)`. `onStats` se llama al iniciar y cuando cambian score, lives o level; `onGameOver` se llama una vez al pasar a `gameover`, y desde ahí el motor deja de procesar la entrada.
3. Crear `components/games/asteroids-game.tsx` (`"use client"`): `<canvas className="game-canvas">`, motor creado en `useEffect` y `destroy()` en el cleanup; otro `useEffect` sincroniza `paused` con `pause()`/`resume()`. Los callbacks se guardan en refs para no recrear el motor en cada render. Listeners de `P`/`Escape` (`onTogglePause`, ignorados si el foco está en un input) y de `visibilitychange` (`onAutoPause` cuando `document.hidden`).
4. Crear `games/registry.ts` con `PlayableGameProps` y `GAME_COMPONENTS = { rocas: AsteroidsGame }`.
5. Modificar `app/juegos/[id]/jugar/page.tsx`: obtener `const Playable = GAME_COMPONENTS[game.id]`. Si existe, renderizar `<Playable key={runId} … />` en lugar de `.game-arena`, no arrancar el `setInterval` falso, tomar `score/lives/level` de `onStats`, abrir el modal en `onGameOver`, pasar `paused={paused || over}` y hacer que "JUGAR DE NUEVO" incremente `runId` y resetee el estado. Si no existe, dejar el flujo actual intacto. Mostrar la leyenda de controles solo cuando hay `Playable`. Prueba manual: `/juegos/rocas/jugar` es jugable y `/juegos/caida/jugar` se ve igual que antes.
6. Agregar a `app/globals.css` las clases `.game-canvas` y `.player-controls` usando los tokens existentes (`--ink-faint`, `--pixel`). Prueba manual: el canvas llena el CRT en escritorio y en un viewport móvil sin deformarse, y las scanlines del CRT siguen encima.
7. Revisión final: `npm run lint` y `npm run build` sin errores nuevos. Recorrer los criterios de aceptación en el navegador, incluyendo salir de la ruta a mitad de partida y volver (sin listeners ni loops duplicados: la velocidad del juego no se duplica).

---

## Acceptance criteria

- [ ] `npm run lint` y `npm run build` terminan sin errores nuevos.
- [ ] Existen `games/asteroids/engine.ts`, `games/registry.ts` y `components/games/asteroids-game.tsx`.
- [ ] `/juegos/rocas/jugar` muestra el juego de asteroides en un canvas dentro del CRT, con nave, asteroides, balas, partículas y power-up en la paleta neón (nave amarilla, asteroides cian, balas magenta, power-up verde).
- [ ] `←` `→` rotan la nave, `↑` la propulsa y `Espacio` dispara; ninguna de esas teclas hace scroll en la página.
- [ ] Destruir un asteroide grande, mediano o pequeño suma 20, 50 o 100 puntos en el HUD de la plataforma ("Puntuación").
- [ ] Al chocar con un asteroide, "Vidas" baja un corazón, la nave reaparece a los 2 s en el centro y parpadea mientras es invencible.
- [ ] Al destruir todos los asteroides, "Nivel" sube en 1 y aparecen `3 + nivel` asteroides grandes.
- [ ] El power-up aparece como máximo una vez por nivel. Al recogerlo, la nave dispara 3 balas durante 5 s y el indicador `3x` se ve en el canvas.
- [ ] El canvas no dibuja puntaje, nivel, vidas ni el texto "GAME OVER".
- [ ] El botón PAUSA, la tecla `P` y la tecla `Esc` pausan y reanudan el juego; en pausa el juego se congela y se ve el overlay "EN PAUSA".
- [ ] Cambiar a otra pestaña pausa el juego; al volver sigue en pausa hasta que el jugador lo reanuda.
- [ ] Al perder la última vida se abre el modal "FIN DEL JUEGO" con la puntuación real, y el juego queda congelado detrás.
- [ ] El botón FIN abre el modal con la puntuación actual y congela el juego.
- [ ] En el modal se puede escribir en el campo de iniciales (incluidas letras y espacio) sin que el juego reaccione.
- [ ] "GUARDAR PUNTUACIÓN" agrega `{ game: "rocas", score, name, at }` con la puntuación real a `localStorage["av_scores"]`.
- [ ] "JUGAR DE NUEVO" empieza una partida nueva con puntuación 0, 3 vidas, nivel 1 y 4 asteroides.
- [ ] La leyenda de controles se muestra bajo el CRT en `/juegos/rocas/jugar` y no en los demás juegos.
- [ ] `/juegos/[id]/jugar` para cualquiera de los otros 7 juegos muestra la arena simulada y el puntaje falso, igual que antes.
- [ ] Salir de `/juegos/rocas/jugar` (SALIR o navegación) y volver no duplica la velocidad del juego ni deja errores en consola, y las flechas vuelven a hacer scroll en otras páginas.
- [ ] El canvas llena el `.crt-screen` sin deformarse en escritorio y en un viewport móvil, y se ve nítido en pantallas de alta densidad.

---

## Decisions

- **Sí:** reutilizar la entrada `rocas` del catálogo. Razón: ya describe un juego de asteroides; crear otra entrada duplicaría el juego. Decisión del usuario.
- **Sí:** reescribir `game.js` como módulo TypeScript con `createAsteroidsGame(canvas, callbacks)` y ciclo de vida explícito. Razón: el original usa globals y listeners en `window` que sobrevivirían a la navegación del App Router; un motor con `destroy()` evita fugas. Se descartó embeberlo con `<iframe>` porque obligaría a comunicar puntaje y pausa por `postMessage`.
- **Sí:** mantener el motor libre de React y envolverlo en un componente cliente. Razón: el loop de 60 fps no debe causar renders de React; solo `onStats` actualiza el estado, y solo cuando cambian los valores.
- **Sí:** usar el HUD React de la plataforma y quitar el HUD y el overlay de game over del canvas. Razón: evita información duplicada y mantiene el look de la plataforma. El indicador `3x` queda en canvas porque es específico del juego.
- **Sí:** paleta neón en lugar del blanco y negro original, sin tocar formas ni mecánicas. Decisión del usuario.
- **Sí:** mecánicas idénticas al original, incluido el power-up de triple disparo. El nivel del HUD pasa a ser el nivel real del juego. Decisión del usuario.
- **Sí:** mundo lógico fijo de 800×600 escalado por CSS con ajuste a `devicePixelRatio`. Razón: conserva la física del original y aprovecha que `.crt-screen` ya es 4:3.
- **Sí:** registro `GAME_COMPONENTS` por id, con arena simulada como fallback. Razón: los otros juegos siguen funcionando igual y los próximos ports (tetris, arkanoid) solo agregan una entrada.
- **Sí:** reiniciar remontando el componente con `key={runId}`. Razón: garantiza un motor limpio sin exponer un `restart()` que tenga que resetear todo el estado a mano.
- **Sí:** modal "FIN DEL JUEGO" de la plataforma como único flujo de fin de partida, y se elimina "ESPACIO PARA REINICIAR". Decisión del usuario.
- **Sí:** pausa con botón, `P`/`Esc` y pausa automática al ocultar la pestaña, todo sobre un único estado `paused`. Decisión del usuario.
- **Sí:** archivos en `games/asteroids/` (motor), `games/registry.ts` y `components/games/` (wrapper). Decisión del usuario.
- **No:** guardar puntajes en Supabase. Razón: aún no hay tablas ni auth real (SPEC 03); se sigue usando `localStorage["av_scores"]`.
- **No:** controles táctiles. Razón: solo teclado, igual que el original; el soporte móvil va en otro spec.

---

## Identified risks

- **Doble montaje en desarrollo (React Strict Mode):** el `useEffect` se ejecuta, se limpia y se vuelve a ejecutar. Si `destroy()` no cancela el `requestAnimationFrame` o no quita los listeners, habrá dos loops a la vez (el juego iría al doble de velocidad) o disparos dobles. Se valida en el paso 7.
- **Captura de teclado demasiado amplia:** si el `preventDefault` de Espacio o de las flechas no excluye `input`/`textarea`, el campo de iniciales del modal no aceptará espacios. Si los listeners no se quitan al desmontar, las flechas dejarán de hacer scroll en otras páginas.
- **Callbacks obsoletos:** si el motor guarda las referencias iniciales de `onStats`/`onGameOver` y la página las recrea en cada render, puede actualizar un estado viejo. Se mitiga guardando los callbacks en refs dentro del wrapper.
- **Salto de `dt` al reanudar:** si `resume()` no reinicia `lastTime`, el primer frame tras una pausa larga usa un `dt` enorme, aunque el tope de 50 ms lo acota. Hay que reiniciarlo igual para evitar un tirón.
- **Rendimiento de `shadowBlur`:** el brillo en canvas es caro con muchas partículas. Si baja de 60 fps, se aplica el brillo solo a la nave, los asteroides y el power-up, no a las partículas.

---

## What is **not** in this spec

- Puntajes en Supabase y Salón de la Fama con datos reales.
- Controles táctiles o de gamepad.
- Ports de tetris y arkanoid.
- Cambios en `lib/data.ts`, en la página de detalle o en otras rutas.
- Nuevas mecánicas (OVNIs, sonido, más power-ups).
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
