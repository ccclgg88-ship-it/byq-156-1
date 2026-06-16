import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Cell,
  LevelConfig,
  LevelProgress,
  GameSave,
  BoardSnapshot,
  Target,
  PetMood,
  Position,
} from '../types'
import { BOARD_SIZE } from '../types'
import levelsData from '../data/levels.json'

const levels = levelsData as LevelConfig[]

interface GameState {
  save: GameSave
  currentLevel: LevelConfig | null
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
  gameStatus: 'idle' | 'playing' | 'win' | 'lose'
  invalidSwaps: number
  usedUltimate: boolean
  watchedAd: boolean
  comboCount: number

  setCurrentLevel: (levelId: number) => void
  initBoard: () => void
  setBoard: (board: Cell[][]) => void
  setMovesLeft: (moves: number) => void
  setTargets: (targets: Target[]) => void
  setRelaxValue: (value: number) => void
  setSelectedCell: (pos: Position | null) => void
  setIsAnimating: (animating: boolean) => void
  setPetMood: (mood: PetMood) => void
  setGameStatus: (status: 'idle' | 'playing' | 'win' | 'lose') => void
  setComboCount: (count: number) => void
  decrementMoves: () => void
  incrementInvalidSwaps: () => void
  pushUndo: (snapshot: BoardSnapshot) => void
  popUndo: () => BoardSnapshot | null
  useUndo: () => boolean
  useShuffle: () => boolean
  useUltimate: () => boolean
  watchAd: () => boolean
  updateLevelProgress: (levelId: number, stars: 0 | 1 | 2 | 3, score: number) => void
  resetLevel: () => void
  getLevelProgress: (levelId: number) => LevelProgress | undefined
  getAllLevels: () => LevelConfig[]
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

const initialSave: GameSave = {
  levels: levels.map((level) => ({
    levelId: level.id,
    stars: 0,
    completed: false,
    bestScore: 0,
  })),
  totalRelaxValue: 0,
  currentLevel: 1,
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      save: initialSave,
      currentLevel: null,
      board: createEmptyBoard(),
      movesLeft: 0,
      targets: [],
      relaxValue: 0,
      shuffleCount: 0,
      undoStack: [],
      undoCount: 3,
      petMood: 'idle',
      selectedCell: null,
      isAnimating: false,
      gameStatus: 'idle',
      invalidSwaps: 0,
      usedUltimate: false,
      watchedAd: false,
      comboCount: 0,

      setCurrentLevel: (levelId: number) => {
        const level = levels.find((l) => l.id === levelId)
        if (level) {
          set({
            currentLevel: level,
            movesLeft: level.moves + (level.bonusMoves || 0),
            targets: level.targets.map((t) => ({ ...t, current: 0 })),
            relaxValue: 0,
            shuffleCount: 0,
            undoStack: [],
            undoCount: 3,
            petMood: 'idle',
            selectedCell: null,
            isAnimating: false,
            gameStatus: 'playing',
            invalidSwaps: 0,
            usedUltimate: false,
            watchedAd: false,
            comboCount: 0,
          })
        }
      },

      initBoard: () => {
        const level = get().currentLevel
        if (!level) return

        const board = createEmptyBoard()

        level.obstacles.forEach((obs) => {
          if (obs.row >= 0 && obs.row < BOARD_SIZE && obs.col >= 0 && obs.col < BOARD_SIZE) {
            board[obs.row][obs.col].isObstacle = true
          }
        })

        set({ board })
      },

      setBoard: (board: Cell[][]) => set({ board }),
      setMovesLeft: (moves: number) => set({ movesLeft: moves }),
      setTargets: (targets: Target[]) => set({ targets }),
      setRelaxValue: (value: number) => set({ relaxValue: value }),
      setSelectedCell: (pos: Position | null) => set({ selectedCell: pos }),
      setIsAnimating: (animating: boolean) => set({ isAnimating: animating }),
      setPetMood: (mood: PetMood) => set({ petMood: mood }),
      setGameStatus: (status: 'idle' | 'playing' | 'win' | 'lose') => set({ gameStatus: status }),
      setComboCount: (count: number) => set({ comboCount: count }),

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
        if (undoStack.length < 3) {
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
        const { shuffleCount, currentLevel } = get()
        if (!currentLevel || shuffleCount >= currentLevel.shuffleLimit) return false
        set({ shuffleCount: shuffleCount + 1 })
        return true
      },

      useUltimate: (): boolean => {
        const { usedUltimate, relaxValue, currentLevel } = get()
        if (usedUltimate || !currentLevel || relaxValue < currentLevel.maxRelaxValue) return false
        set({ usedUltimate: true, relaxValue: 0 })
        return true
      },

      watchAd: (): boolean => {
        const { watchedAd, movesLeft } = get()
        if (watchedAd) return false
        set({ watchedAd: true, movesLeft: movesLeft + 3 })
        return true
      },

      updateLevelProgress: (levelId: number, stars: 0 | 1 | 2 | 3, score: number) => {
        const { save } = get()
        const levelIndex = save.levels.findIndex((l) => l.levelId === levelId)
        if (levelIndex === -1) return

        const newLevels = [...save.levels]
        const existing = newLevels[levelIndex]

        if (stars > existing.stars) {
          newLevels[levelIndex] = {
            ...existing,
            stars,
            completed: stars > 0 ? true : existing.completed,
            bestScore: Math.max(existing.bestScore, score),
          }
        }

        const nextLevelId = levelId + 1
        if (stars > 0 && nextLevelId <= levels.length) {
          const nextIndex = newLevels.findIndex((l) => l.levelId === nextLevelId)
          if (nextIndex !== -1) {
            newLevels[nextIndex] = {
              ...newLevels[nextIndex],
              stars: Math.max(newLevels[nextIndex].stars, 0) as 0 | 1 | 2 | 3,
            }
          }
        }

        set({
          save: {
            ...save,
            levels: newLevels,
            totalRelaxValue: save.totalRelaxValue + score,
            currentLevel: Math.max(save.currentLevel, levelId),
          },
        })
      },

      resetLevel: () => {
        const { currentLevel } = get()
        if (!currentLevel) return
        get().setCurrentLevel(currentLevel.id)
        get().initBoard()
      },

      getLevelProgress: (levelId: number): LevelProgress | undefined => {
        return get().save.levels.find((l) => l.levelId === levelId)
      },

      getAllLevels: (): LevelConfig[] => levels,
    }),
    {
      name: 'bubble-match-save',
      partialize: (state) => ({ save: state.save }),
    }
  )
)
