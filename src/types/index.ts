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

export type DailyChallengeType = 'singleColor' | 'dualTarget' | 'collectSpecial' | 'obstacleChallenge'

export interface DailyChallengeConfig {
  date: string
  title: string
  type: DailyChallengeType
  moves: number
  colors: BubbleColor[]
  targets: Target[]
  obstacles: Position[]
  maxRelaxValue: number
}

export interface DailyBadge {
  date: string
  dayOfWeek: number
  earnedAt: number
}

export interface DailySave {
  currentDate: string
  completed: boolean
  stars: 0 | 1 | 2 | 3
  bestMovesLeft: number
  ongoingGame: DailyOngoingGame | null
  streak: number
  longestStreak: number
  totalCompleted: number
  badges: DailyBadge[]
  lastCompletedDate: string | null
}

export interface DailyOngoingGame {
  board: Cell[][]
  movesLeft: number
  targets: Target[]
  relaxValue: number
  shuffleCount: number
  undoCount: number
  undoStack: BoardSnapshot[]
  invalidSwaps: number
  usedUltimate: boolean
}

export const DAILY_BADGE_ICONS = ['\u{1F3C6}', '\u{1F3AF}', '\u{1F48E}', '\u{1F31F}', '\u{1F525}', '\u{1F308}', '\u{1F451}']

export const DAILY_THEME_NAMES: Record<DailyChallengeType, string> = {
  singleColor: '单色猎手',
  dualTarget: '双线作战',
  collectSpecial: '特消达人',
  obstacleChallenge: '障碍突破',
}

export const MILESTONE_QUOTES: Record<number, string> = {
  3: '三天连击！你已经找到节奏了！',
  7: '一周全勤！你是真正的压力克星！',
  30: '三十天传奇！你是气泡消消乐之王！',
}

export const COLOR_MAP: Record<BubbleColor, { fill: string; stroke: string; emoji: string; label: string }> = {
  cat: { fill: '#FF9B9B', stroke: '#E07070', emoji: '\u{1F43E}', label: '猫爪粉' },
  dog: { fill: '#C4956A', stroke: '#A07850', emoji: '\u{1F9B4}', label: '狗骨棕' },
  pig: { fill: '#FFB7C5', stroke: '#E095A5', emoji: '\u{1F43D}', label: '猪鼻桃' },
  fish: { fill: '#85C1E9', stroke: '#5FA0D0', emoji: '\u{1F41F}', label: '奶鱼蓝' },
  clover: { fill: '#7DCEA0', stroke: '#50B07A', emoji: '\u{1F340}', label: '幸运草绿' },
  orange: { fill: '#FFB347', stroke: '#E09530', emoji: '\u{1F9E1}', label: '阳光橙' },
}

export const ALL_COLORS: BubbleColor[] = ['cat', 'dog', 'pig', 'fish', 'clover', 'orange']

export const BOARD_SIZE = 8

export const PET_PHRASES = [
  '加油鸭！',
  '你可以的！',
  '太棒啦！',
  '继续冲！',
  '哇塞！',
  '好厉害！',
  '再接再厉！',
  '冲冲冲！',
  '绝绝子！',
  '稳住，我们能赢！',
]
