"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { GAMES } from "@/lib/data";
import { useUser } from "@/components/user-provider";
import { GAME_COMPONENTS } from "@/games/registry";

export default function GamePlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  const { id } = use(params);
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();
  const Playable = GAME_COMPONENTS[game.id];

  const router = useRouter();
  const { user } = useUser();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);
  const [gameLevel, setGameLevel] = useState(1);
  const [runId, setRunId] = useState(0);

  // Juegos reales informan su nivel; la arena simulada lo deriva del puntaje falso
  const level = Playable ? gameLevel : Math.floor(score / 2500) + 1;

  useEffect(() => {
    if (Playable || over || paused) return;
    const t = setInterval(() => setScore((s) => s + Math.floor(10 + Math.random() * 90)), 220);
    return () => clearInterval(t);
  }, [Playable, over, paused]);

  const endGame = () => setOver(true);
  const restart = () => {
    setScore(0);
    setLives(3);
    setGameLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setRunId((r) => r + 1);
  };

  const handleStats = (stats: { score: number; lives: number; level: number }) => {
    setScore(stats.score);
    setLives(stats.lives);
    setGameLevel(stats.level);
  };
  const togglePause = () => {
    if (!over) setPaused((p) => !p);
  };

  const saveScore = () => {
    try {
      const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
      all.push({ game: game.id, score, name, at: Date.now() });
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {
      // ignore inaccessible storage
    }
    setSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat"><div className="l">Jugador</div><div className="v" style={{ color: "var(--ink)" }}>{name}</div></div>
          <div className="hud-stat"><div className="l">Puntuación</div><div className="v">{score.toLocaleString("es-ES")}</div></div>
          <div className="hud-stat lives"><div className="l">Vidas</div><div className="v">{"♥ ".repeat(lives).trim() || "—"}</div></div>
          <div className="hud-stat level"><div className="l">Nivel</div><div className="v">{String(level).padStart(2, "0")}</div></div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>{paused ? "REANUDAR" : "PAUSA"}</button>
          <button className="btn magenta" onClick={endGame}>FIN</button>
          <button className="btn ghost" onClick={() => router.push(`/juegos/${game.id}`)}>SALIR</button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {Playable ? (
            <Playable
              key={runId}
              paused={paused || over}
              onStats={handleStats}
              onGameOver={endGame}
              onTogglePause={togglePause}
              onAutoPause={() => setPaused(true)}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>PULSA REANUDAR PARA CONTINUAR</div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {Playable && (
        <div className="player-controls">← → ROTAR · ↑ PROPULSAR · ESPACIO DISPARAR · P PAUSA</div>
      )}

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input value={name} onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))} placeholder="TUS INICIALES" />
                <button className="btn yellow" onClick={saveScore}>GUARDAR PUNTUACIÓN</button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>JUGAR DE NUEVO</button>
              <button className="btn magenta" onClick={() => router.push("/")}>VOLVER AL VAULT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
