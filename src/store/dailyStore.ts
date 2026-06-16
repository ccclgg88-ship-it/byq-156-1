import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Cell,
  BoardSnapshot,
  Target,
  PetMood,
  Position,
  DailySave,
  DailyOngoingGame,
  DailyBadge,
  BubbleColor,
} from '../types'
import { BOARD_SIZE, DAILY_BADGE_ICONS } from '../types'
import { generateDailyChallenge, getTodayString, getYesterdayString, getDailyStars } from '../utils/dailyChallenge'
import type { DailyChallengeConfig } from '../types'

interface DailyState {
  save: DailySave
  config: DailyChallengeConfig | null
  board: Cell[][]
  movesLeft: number
  targets: Target[]
  relaxValue: number
  shuffleCount: number
  undoStack: BoardSnapshot[]
  undoCount: number
  petMood: PetMood
  selectedCell: Position | null
  isAnimating: boolean
  gameStatus: 'idle' | 'preview' | 'playing' | 'win' | 'lose'
  invalidSwaps: number
  usedUltimate: boolean
  comboCount: number
  showExitConfirm: boolean

  loadToday: () => void
  startChallenge: () => void
  resumeChallenge: () => void
  setBoard: (board: Cell[][]) => void
  setMovesLeft: (moves: number) => void
  setTargets: (targets: Target[]) => void
  setRelaxValue: (value: number) => void
  setSelectedCell: (pos: Position | null) => void
  setIsAnimating: (animating: boolean) => void
  setPetMood: (mood: PetMood) => void
  setGameStatus: (status: 'idle' | 'preview' | 'playing' | 'win' | 'lose') => void
  setComboCount: (count: number) => void
  setShowExitConfirm: (show: boolean) => void
  decrementMoves: () => void
  incrementInvalidSwaps: () => void
  pushUndo: (snapshot: BoardSnapshot) => void
  popUndo: () => BoardSnapshot | null
  useUndo: () => boolean
  useShuffle: () => boolean
  useUltimate: (board: Cell[][]) => boolean
  completeChallenge: (movesLeft: number, invalidSwaps: number) => void
  failChallenge: () => void
  resetChallenge: () => void
  isTodayCompleted: () => boolean
  getTodayStars: () => 0 | 1 | 2 | 3
  getStreak: () => number
  getBadgeIcon: (dayOfWeek: number) => string
}

const createEmptyBoard = (): Cell[][] => {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() =>
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => ({
          color: null,
          special: null,
          isObstacle: false,
        }))
    )
}

const initialDailySave: DailySave = {
  currentDate: '',
  completed: false,
  stars: 0,
  bestMovesLeft: 0,
  ongoingGame: null,
  streak: 0,
  longestStreak: 0,
  totalCompleted: 0,
  badges: [],
  lastCompletedDate: null,
}

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      save: initialDailySave,
      config: null,
      board: createEmptyBoard(),
      movesLeft: 0,
      targets: [],
      relaxValue: 0,
      shuffleCount: 0,
      undoStack: [],
      undoCount: 1,
      petMood: 'idle',
      selectedCell: null,
      isAnimating: false,
      gameStatus: 'idle',
      invalidSwaps: 0,
      usedUltimate: false,
      comboCount: 0,
      showExitConfirm: false,

      loadToday: () => {
        const today = getTodayString()
        const config = generateDailyChallenge(today)
        const { save } = get()

        if (save.currentDate !== today) {
          const yesterday = getYesterdayString()
          const streakBroken = save.lastCompletedDate !== yesterday && save.lastCompletedDate !== today
          const newStreak = streakBroken ? 0 : save.streak

          set({
            config,
            save: {
              ...save,
              currentDate: today,
              completed: false,
              stars: 0,
              bestMovesLeft: 0,
              ongoingGame: null,
              streak: newStreak,
            },
            gameStatus: 'preview',
          })
        } else {
          set({
            config,
            gameStatus: save.completed ? 'preview' : 'preview',
          })
        }
      },

      startChallenge: () => {
        const { config } = get()
        if (!config) return

        const board = createEmptyBoard()
        config.obstacles.forEach((obs) => {
          if (obs.row >= 0 && obs.row < BOARD_SIZE && obs.col >= 0 && obs.col < BOARD_SIZE) {
            board[obs.row][obs.col].isObstacle = true
          }
        })

        set({
          board,
          movesLeft: config.moves,
          targets: config.targets.map((t) => ({ ...t, current: 0 })),
          relaxValue: 0,
          shuffleCount: 0,
          undoStack: [],
          undoCount: 1,
          petMood: 'idle',
          selectedCell: null,
          isAnimating: false,
          gameStatus: 'playing',
          invalidSwaps: 0,
          usedUltimate: false,
          comboCount: 0,
        })
      },

      resumeChallenge: () => {
        const { save } = get()
        if (!save.ongoingGame) return

        set({
          board: save.ongoingGame.board,
          movesLeft: save.ongoingGame.movesLeft,
          targets: save.ongoingGame.targets,
          relaxValue: save.ongoingGame.relaxValue,
          shuffleCount: save.ongoingGame.shuffleCount,
          undoCount: save.ongoingGame.undoCount,
          undoStack: save.ongoingGame.undoStack,
          invalidSwaps: save.ongoingGame.invalidSwaps,
          usedUltimate: save.ongoingGame.usedUltimate,
          gameStatus: 'playing',
        })
      },

      setBoard: (board: Cell[][]) => {
        set({ board })
        const { save, movesLeft, targets, relaxValue, shuffleCount, undoCount, undoStack, invalidSwaps, usedUltimate } = get()
        set({
          save: {
            ...save,
            ongoingGame: {
              board,
              movesLeft,
              targets,
              relaxValue,
              shuffleCount,
              undoCount,
              undoStack,
              invalidSwaps,
              usedUltimate,
            },
          },
        })
      },

      setMovesLeft: (moves: number) => set({ movesLeft: moves }),
      setTargets: (targets: Target[]) => set({ targets }),
      setRelaxValue: (value: number) => set({ relaxValue: value }),
      setSelectedCell: (pos: Position | null) => set({ selectedCell: pos }),
      setIsAnimating: (animating: boolean) => set({ isAnimating: animating }),
      setPetMood: (mood: PetMood) => set({ petMood: mood }),
      setGameStatus: (status: 'idle' | 'preview' | 'playing' | 'win' | 'lose') => set({ gameStatus: status }),
      setComboCount: (count: number) => set({ comboCount: count }),
      setShowExitConfirm: (show: boolean) => set({ showExitConfirm: show }),

      decrementMoves: () => {
        const { movesLeft } = get()
        set({ movesLeft: movesLeft - 1 })
      },

      incrementInvalidSwaps: () => {
        const { invalidSwaps } = get()
        set({ invalidSwaps: invalidSwaps + 1 })
      },

      pushUndo: (snapshot: BoardSnapshot) => {
        const { undoStack } = get()
        if (undoStack.length < 1) {
          set({ undoStack: [...undoStack, snapshot] })
        }
      },

      popUndo: (): BoardSnapshot | null => {
        const { undoStack } = get()
        if (undoStack.length === 0) return null
        const snapshot = undoStack[undoStack.length - 1]
        set({ undoStack: undoStack.slice(0, -1) })
        return snapshot
      },

      useUndo: (): boolean => {
        const { undoCount } = get()
        if (undoCount <= 0) return false
        set({ undoCount: undoCount - 1 })
        return true
      },

      useShuffle: (): boolean => {
        const { shuffleCount } = get()
        if (shuffleCount >= 1) return false
        set({ shuffleCount: shuffleCount + 1 })
        return true
      },

      useUltimate: (board: Cell[][]): boolean => {
        const { usedUltimate, relaxValue, config } = get()
        if (usedUltimate || !config || relaxValue < config.maxRelaxValue) return false

        const colorCount = new Map<BubbleColor, number>()
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            const color = board[row][col].color
            if (color) {
              colorCount.set(color, (colorCount.get(color) || 0) + 1)
            }
          }
        }

        let hasBubbles = false
        colorCount.forEach((count) => {
          if (count > 0) hasBubbles = true
        })

        if (!hasBubbles) return false

        set({ usedUltimate: true, relaxValue: 0 })
        return true
      },

      completeChallenge: (movesLeft: number, invalidSwaps: number) => {
        const { save, config } = get()
        if (!config) return

        const stars = getDailyStars(movesLeft, invalidSwaps, true)
        const today = getTodayString()
        const yesterday = getYesterdayString()

        let newStreak = save.streak
        if (save.lastCompletedDate === yesterday || save.lastCompletedDate === today) {
          newStreak = save.streak
        } else {
          newStreak = 0
        }
        newStreak += 1

        const now = new Date()
        const dayOfWeek = now.getDay()
        const newBadge: DailyBadge = {
          date: today,
          dayOfWeek,
          earnedAt: Date.now(),
        }

        const badges = [...save.badges]
        if (!badges.find((b) => b.date === today)) {
          badges.push(newBadge)
        }

        set({
          save: {
            ...save,
            completed: true,
            stars,
            bestMovesLeft: Math.max(save.bestMovesLeft, movesLeft),
            ongoingGame: null,
            streak: newStreak,
            longestStreak: Math.max(save.longestStreak, newStreak),
            totalCompleted: save.totalCompleted + 1,
            badges,
            lastCompletedDate: today,
          },
          gameStatus: 'win',
        })
      },

      failChallenge: () => {
        const { save } = get()
        set({
          save: {
            ...save,
            ongoingGame: null,
          },
          gameStatus: 'lose',
        })
      },

      resetChallenge: () => {
        get().startChallenge()
      },

      isTodayCompleted: (): boolean => {
        const { save } = get()
        return save.currentDate === getTodayString() && save.completed
      },

      getTodayStars: (): 0 | 1 | 2 | 3 => {
        const { save } = get()
        if (save.currentDate === getTodayString() && save.completed) {
          return save.stars
        }
        return 0
      },

      getStreak: (): number => {
        return get().save.streak
      },

      getBadgeIcon: (dayOfWeek: number): string => {
        return DAILY_BADGE_ICONS[dayOfWeek % DAILY_BADGE_ICONS.length]
      },
    }),
    {
      name: 'bubble-match-daily-save',
      partialize: (state) => ({ save: state.save }),
    }
  )
)
