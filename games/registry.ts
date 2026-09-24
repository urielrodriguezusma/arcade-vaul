import type { ComponentType } from "react";
import { AsteroidsGame } from "@/components/games/asteroids-game";

// Contrato que cumple cualquier juego jugable dentro de /juegos/[id]/jugar
export interface PlayableGameProps {
  paused: boolean;
  onStats: (stats: { score: number; lives: number; level: number }) => void;
  onGameOver: (finalScore: number) => void;
  onTogglePause: () => void; // teclas P / Escape
  onAutoPause: () => void; // pestaña oculta
}

// id de juego (lib/data.ts) → componente jugable. Los ids sin entrada usan la arena simulada.
export const GAME_COMPONENTS: Partial<
  Record<string, ComponentType<PlayableGameProps>>
> = {
  rocas: AsteroidsGame,
};
