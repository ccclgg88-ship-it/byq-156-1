import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import GameBoard from '../components/GameBoard'
import PetHelper from '../components/PetHelper'
import ResultModal from '../components/ResultModal'
import { COLOR_MAP } from '../types'
import { cloneBoard, shuffleBoard } from '../utils/gameEngine'

const GamePage = () => {
  const navigate = useNavigate()
  const { levelId } = useParams<{ levelId: string }>()

  const {
    setCurrentLevel,
    currentLevel,
    movesLeft,
    targets,
    gameStatus,
    undoCount,
    useUndo,
    popUndo,
    setBoard,
    setMovesLeft,
    setTargets,
    setRelaxValue,
    shuffleCount,
    useShuffle,
    board,
    comboCount,
  } = useGameStore()

  useEffect(() => {
    if (levelId) {
      const id = parseInt(levelId, 10)
      setCurrentLevel(id)
    }
  }, [levelId, setCurrentLevel])

  const handleUndo = () => {
    if (!useUndo()) return
    const snapshot = popUndo()
    if (snapshot) {
      setBoard(cloneBoard(snapshot.board))
      setMovesLeft(snapshot.movesLeft)
      setTargets(snapshot.targets.map((t) => ({ ...t })))
      setRelaxValue(snapshot.relaxValue)
    }
  }

  const handleShuffle = () => {
    if (!useShuffle() || !currentLevel) return
    const shuffled = shuffleBoard(board, currentLevel.colors)
    setBoard(shuffled)
  }

  const handleBack = () => {
    navigate('/')
  }

  if (!currentLevel) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-lavender/30 via-cream to-peach/30 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white/70 backdrop-blur-sm shadow-md">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-lavender/30 flex items-center justify-center hover:bg-lavender/50 transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-700">第 {currentLevel.id} 关</h1>
          <p className="text-xs text-gray-500">
            步数: <span className="font-bold text-lavender">{movesLeft}</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
          <span className="text-sm font-bold text-yellow-600">{comboCount > 1 ? `${comboCount}连击` : '💫'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 p-4 overflow-auto">
        <div className="flex flex-col items-center">
          <div className="mb-3 w-full max-w-xs">
            <p className="text-sm font-bold text-gray-600 mb-2 text-center">🎯 目标</p>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 flex flex-wrap gap-2 justify-center">
              {targets.map((target, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                    target.current >= target.count
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {target.type === 'eliminate' && target.color && (
                    <span>{COLOR_MAP[target.color].emoji}</span>
                  )}
                  {target.type === 'collectSpecial' && <span>✨</span>}
                  <span className="text-sm font-medium">
                    {target.current}/{target.count}
                  </span>
                  {target.current >= target.count && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>

          <GameBoard cellSize={44} />

          <div className="mt-3 flex gap-3">
            <button
              onClick={handleUndo}
              disabled={undoCount <= 0}
              className={`
                flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-all
                ${undoCount > 0
                  ? 'bg-blue-400 text-white hover:bg-blue-500 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              ↩️ 撤销 ({undoCount})
            </button>
            <button
              onClick={handleShuffle}
              disabled={shuffleCount >= currentLevel.shuffleLimit}
              className={`
                flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-all
                ${shuffleCount < currentLevel.shuffleLimit
                  ? 'bg-orange-400 text-white hover:bg-orange-500 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              🔀 洗牌 ({currentLevel.shuffleLimit - shuffleCount})
            </button>
          </div>
        </div>

        <div className="w-full max-w-xs lg:w-64">
          <PetHelper />
        </div>
      </div>

      <ResultModal isOpen={gameStatus === 'win' || gameStatus === 'lose'} />
    </div>
  )
}

export default GamePage
