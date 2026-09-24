"use client";

import { useEffect, useRef } from "react";
import {
  createAsteroidsGame,
  type AsteroidsGame as AsteroidsEngine,
  type AsteroidsStats,
} from "@/games/asteroids/engine";

interface AsteroidsGameProps {
  paused: boolean;
  onStats: (stats: AsteroidsStats) => void;
  onGameOver: (finalScore: number) => void;
  onTogglePause: () => void; // teclas P / Escape
  onAutoPause: () => void; // pestaña oculta
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function AsteroidsGame({
  paused,
  onStats,
  onGameOver,
  onTogglePause,
  onAutoPause,
}: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);

  // Callbacks en refs: el motor se crea una sola vez y siempre llama a la versión más reciente.
  const callbacksRef = useRef({
    onStats,
    onGameOver,
    onTogglePause,
    onAutoPause,
  });
  useEffect(() => {
    callbacksRef.current = { onStats, onGameOver, onTogglePause, onAutoPause };
  });

  // Ciclo de vida del motor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createAsteroidsGame(canvas, {
      onStats: (stats) => callbacksRef.current.onStats(stats),
      onGameOver: (finalScore) => callbacksRef.current.onGameOver(finalScore),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, []);

  // Sincroniza la prop paused con el motor
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [paused]);

  // P / Escape piden alternar la pausa; ocultar la pestaña pide la pausa automática
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isTypingTarget(e.target)) return;
      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        callbacksRef.current.onTogglePause();
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) callbacksRef.current.onAutoPause();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="game-canvas" />;
}
