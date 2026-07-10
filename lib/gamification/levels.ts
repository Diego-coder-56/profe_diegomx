// lib/gamification/levels.ts — cálculo de nivel a partir de XP (función pura)
// Sin dependencias ni efectos: fácil de probar y reutilizar en cliente o servidor.

const BASE_XP = 100   // XP para subir del nivel 1 al 2
const STEP_XP = 50    // incremento de requisito por nivel

export interface LevelInfo {
  level: number
  xpIntoLevel: number      // XP acumulada dentro del nivel actual
  xpForNextLevel: number   // XP total que requiere el nivel actual para avanzar
  progressPct: number      // 0-100 hacia el siguiente nivel
  totalXp: number
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp || 0))
  let need = BASE_XP
  while (remaining >= need) {
    remaining -= need
    level++
    need = BASE_XP + (level - 1) * STEP_XP
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: need,
    progressPct: Math.min(100, Math.round((remaining / need) * 100)),
    totalXp: Math.max(0, Math.floor(totalXp || 0)),
  }
}

// Reglas de XP por acción (req. Sistema de XP)
export const XP_RULES = {
  video: 20,
  quiz: 50,
  flashcards: 15,
  daily_login: 10,
  forum: 5,
  challenge: 100,
} as const

export type XpAction = keyof typeof XP_RULES
