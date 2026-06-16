import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { PET_PHRASES } from '../types'
import { ultimateClearColor, getMostCommonColor } from '../utils/gameEngine'

const PetHelper = () => {
  const {
    petMood,
    relaxValue,
    currentLevel,
    usedUltimate,
    useUltimate,
    board,
    setBoard,
    gameStatus,
    setPetMood,
  } = useGameStore()

  const [showPhrase, setShowPhrase] = useState(false)
  const [currentPhrase, setCurrentPhrase] = useState(PET_PHRASES[0])

  const maxRelaxValue = currentLevel?.maxRelaxValue || 100
  const relaxPercent = Math.min(100, (relaxValue / maxRelaxValue) * 100)
  const canUseUltimate = relaxValue >= maxRelaxValue && !usedUltimate && gameStatus === 'playing'

  useEffect(() => {
    if (petMood === 'cheer') {
      const randomPhrase = PET_PHRASES[Math.floor(Math.random() * PET_PHRASES.length)]
      setCurrentPhrase(randomPhrase)
      setShowPhrase(true)

      const timer = setTimeout(() => {
        setShowPhrase(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [petMood])

  const handleUltimate = () => {
    if (!canUseUltimate) return

    const mostCommon = getMostCommonColor(board)
    if (!mostCommon) return

    if (useUltimate()) {
      const { board: newBoard } = ultimateClearColor(board, mostCommon)
      setBoard(newBoard)
      setPetMood('cheer')
    }
  }

  const getPetEmoji = () => {
    switch (petMood) {
      case 'cheer':
        return '🎉'
      case 'tense':
        return '😰'
      default:
        return '🐱'
    }
  }

  const getPetAnimation = () => {
    switch (petMood) {
      case 'cheer':
        return 'animate-bounce'
      case 'tense':
        return 'animate-shake'
      default:
        return 'animate-float'
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-5xl ${getPetAnimation()}`}>
          {getPetEmoji()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-700">咪咪助手</p>
          <p className="text-xs text-gray-500">和你一起消除压力~</p>
        </div>
      </div>

      {showPhrase && (
        <div className="bg-lavender/30 rounded-xl px-3 py-2 mb-3 animate-bounce-in relative">
          <p className="text-sm text-center text-gray-700 font-medium">
            {currentPhrase}
          </p>
          <div className="absolute -top-2 left-6 w-4 h-4 bg-lavender/30 rotate-45" />
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">💖 轻松值</span>
          <span className="font-bold text-coral">
            {relaxValue} / {maxRelaxValue}
          </span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-red-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${relaxPercent}%` }}
          />
        </div>
      </div>

      <button
        onClick={handleUltimate}
        disabled={!canUseUltimate}
        className={`
          w-full py-3 rounded-xl font-bold text-white transition-all duration-300
          ${canUseUltimate
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 active:scale-95 animate-pulse-glow cursor-pointer'
            : 'bg-gray-300 cursor-not-allowed'
          }
        `}
      >
        {usedUltimate ? '✨ 已使用大招' : '🌟 宠物大招'}
      </button>

      <div className="mt-3 text-xs text-gray-500 text-center">
        <p>轻松值满格时释放大招</p>
        <p>随机清除一种颜色的全部气泡！</p>
      </div>
    </div>
  )
}

export default PetHelper
