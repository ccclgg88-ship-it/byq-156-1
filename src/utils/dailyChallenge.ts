import type { BubbleColor, DailyChallengeConfig, DailyChallengeType, Position } from '../types'
import { ALL_COLORS } from '../types'

const CHALLENGE_TYPES: DailyChallengeType[] = ['singleColor', 'dualTarget', 'collectSpecial', 'obstacleChallenge']

const seededRandom = (seed: number): () => number => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const dateToSeed = (dateStr: string): number => {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export const getTodayString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export const getYesterdayString = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const getDayNumber = (): number => {
  const epoch = new Date('2024-01-01')
  const now = new Date()
  return Math.floor((now.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export const generateDailyChallenge = (dateStr?: string): DailyChallengeConfig => {
  const date = dateStr || getTodayString()
  const seed = dateToSeed(date)
  const rng = seededRandom(seed)
  const dayNum = getDayNumber()

  const typeIndex = Math.floor(rng() * CHALLENGE_TYPES.length)
  const type = CHALLENGE_TYPES[typeIndex]

  const colorCount = 5 + Math.floor(rng() * 2)
  const shuffledColors = [...ALL_COLORS].sort(() => rng() - 0.5)
  const colors = shuffledColors.slice(0, colorCount)

  const targets = generateTargets(type, colors, rng)
  const obstacles = generateObstacles(type, rng)
  const moves = calculateMoves(type, targets, obstacles.length, rng)
  const maxRelaxValue = 80 + Math.floor(rng() * 40)

  return {
    date,
    title: `每日挑战 \u00B7 第 ${dayNum} 天`,
    type,
    moves,
    colors,
    targets,
    obstacles,
    maxRelaxValue,
  }
}

const generateTargets = (type: DailyChallengeType, colors: BubbleColor[], rng: () => number) => {
  switch (type) {
    case 'singleColor': {
      const color = colors[Math.floor(rng() * colors.length)]
      const count = 25 + Math.floor(rng() * 15)
      return [{ type: 'eliminate' as const, color, count, current: 0 }]
    }
    case 'dualTarget': {
      const c1 = colors[Math.floor(rng() * colors.length)]
      let c2 = colors[Math.floor(rng() * colors.length)]
      while (c2 === c1) c2 = colors[Math.floor(rng() * colors.length)]
      return [
        { type: 'eliminate' as const, color: c1, count: 20 + Math.floor(rng() * 10), current: 0 },
        { type: 'eliminate' as const, color: c2, count: 20 + Math.floor(rng() * 10), current: 0 },
      ]
    }
    case 'collectSpecial': {
      const color = colors[Math.floor(rng() * colors.length)]
      return [
        { type: 'collectSpecial' as const, count: 3 + Math.floor(rng() * 3), current: 0 },
        { type: 'eliminate' as const, color, count: 15 + Math.floor(rng() * 10), current: 0 },
      ]
    }
    case 'obstacleChallenge': {
      const color = colors[Math.floor(rng() * colors.length)]
      return [{ type: 'eliminate' as const, color, count: 20 + Math.floor(rng() * 10), current: 0 }]
    }
  }
}

const generateObstacles = (type: DailyChallengeType, rng: () => number): Position[] => {
  if (type !== 'obstacleChallenge') return []

  const count = 4 + Math.floor(rng() * 5)
  const obstacles: Position[] = []
  const used = new Set<string>()

  for (let i = 0; i < count; i++) {
    let row: number, col: number
    let key: string
    let attempts = 0
    do {
      row = 1 + Math.floor(rng() * 6)
      col = 1 + Math.floor(rng() * 6)
      key = `${row},${col}`
      attempts++
    } while (used.has(key) && attempts < 50)

    if (!used.has(key)) {
      used.add(key)
      obstacles.push({ row, col })
    }
  }

  return obstacles
}

const calculateMoves = (type: DailyChallengeType, targets: { count: number }[], obstacleCount: number, rng: () => number): number => {
  let baseMoves = 0

  switch (type) {
    case 'singleColor':
      baseMoves = 25 + Math.floor(rng() * 5)
      break
    case 'dualTarget':
      baseMoves = 28 + Math.floor(rng() * 5)
      break
    case 'collectSpecial':
      baseMoves = 24 + Math.floor(rng() * 5)
      break
    case 'obstacleChallenge':
      baseMoves = 22 + Math.floor(rng() * 5)
      break
  }

  baseMoves -= Math.min(3, Math.floor(obstacleCount / 2))

  return Math.max(18, baseMoves)
}

export const getDailyStars = (movesLeft: number, invalidSwaps: number, won: boolean): 0 | 1 | 2 | 3 => {
  if (!won) return 0
  if (movesLeft >= 6 && invalidSwaps === 0) return 3
  if (movesLeft >= 3) return 2
  return 1
}
