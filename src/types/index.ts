export type BubbleColor = 'cat' | 'dog' | 'pig' | 'fish' | 'clover' | 'orange'

export type SpecialType = 'rowClear' | 'colClear' | 'bomb'

export interface Cell {
  color: BubbleColor | null
  special: SpecialType | null
  isObstacle: boolean
}

export interface Position {
  row: number
  col: number
}

export interface MatchGroup {
  positions: Position[]
  length: number
  direction: 'horizontal' | 'vertical'
}

export interface Target {
  type: 'eliminate' | 'collectSpecial'
  color?: BubbleColor
  count: number
  current: number
}

export interface LevelConfig {
  id: number
  moves: number
  colors: BubbleColor[]
  targets: Target[]
  obstacles: Position[]
  bonusMoves?: number
  shuffleLimit: number
  maxRelaxValue: number
}

export interface LevelProgress {
  levelId: number
  stars: 0 | 1 | 2 | 3
  completed: boolean
  bestScore: number
}

export interface GameSave {
  levels: LevelProgress[]
  totalRelaxValue: number
  currentLevel: number
}

export interface BoardSnapshot {
  board: Cell[][]
  movesLeft: number
  targets: Target[]
  relaxValue: number
}

export type PetMood = 'idle' | 'cheer' | 'tense'

export const COLOR_MAP: Record<BubbleColor, { fill: string; stroke: string; emoji: string; label: string }> = {
  cat: { fill: '#FF9B9B', stroke: '#E07070', emoji: '�', label: '猫爪粉' },
  dog: { fill: '#C4956A', stroke: '#A07850', emoji: '🦴', label: '狗骨棕' },
  pig: { fill: '#FFB7C5', stroke: '#E095A5', emoji: '�', label: '猪鼻桃' },
  fish: { fill: '#85C1E9', stroke: '#5FA0D0', emoji: '🍼', label: '奶鱼蓝' },
  clover: { fill: '#7DCEA0', stroke: '#50B07A', emoji: '🍀', label: '幸运草绿' },
  orange: { fill: '#FFB347', stroke: '#E09530', emoji: '🧡', label: '阳光橙' },
}

export const ALL_COLORS: BubbleColor[] = ['cat', 'dog', 'pig', 'fish', 'clover', 'orange']

export const BOARD_SIZE = 8

export const PET_PHRASES = [
  '加油鸭！💪',
  '你可以的！✨',
  '太棒啦！🎉',
  '继续冲！🚀',
  '哇塞！🌟',
  '好厉害！👏',
  '再接再厉！💖',
  '冲冲冲！⚡',
  '绝绝子！🌈',
  '稳住，我们能赢！🎯',
]
