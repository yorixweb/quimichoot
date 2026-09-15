import { MAX_SCORE, MIN_SCORE } from "./config.js";

export function calculateScore(elapsedSeconds, durationSeconds) {
  const remainingRatio = Math.max(0, 1 - elapsedSeconds / durationSeconds);
  return Math.round(MIN_SCORE + (MAX_SCORE - MIN_SCORE) * remainingRatio);
}

export function rankPlayers(players = {}) {
  return Object.entries(players)
    .map(([id, player]) => ({ id, ...player, score: player.score || 0 }))
    .sort((a, b) => b.score - a.score || (a.name || "").localeCompare(b.name || ""));
}

export function playerPlacement(players, playerId) {
  const ranking = rankPlayers(players);
  const index = ranking.findIndex((player) => player.id === playerId);
  return index >= 0 ? index + 1 : null;
}
