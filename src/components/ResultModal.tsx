import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { getStars } from '../utils/gameEngine'

interface ResultModalProps {
  isOpen: boolean
}

const ResultModal = ({ isOpen }: ResultModalProps) => {
  const navigate = useNavigate()
  const {
    gameStatus,
    currentLevel,
    movesLeft,
    invalidSwaps,
    relaxValue,
    resetLevel,
    setGameStatus,
    watchAd,
    watchedAd,
    getAllLevels,
  } = useGameStore()

  const [showStars, setShowStars] = useState(false)
  const [star1, setStar1] = useState(false)
  const [star2, setStar2] = useState(false)
  const [star3, setStar3] = useState(false)

  const isWin = gameStatus === 'win'
  const stars = getStars(movesLeft, invalidSwaps, isWin)
  const levels = getAllLevels()
  const hasNextLevel = currentLevel && currentLevel.id < levels.length

  useEffect(() => {
    if (isOpen && isWin) {
      setShowStars(false)
      setStar1(false)
      setStar2(false)
      setStar3(false)

      const timer = setTimeout(() => setShowStars(true), 300)
      const t1 = setTimeout(() => setStar1(true), 500)
      const t2 = setTimeout(() => setStar2(stars >= 2), 900)
      const t3 = setTimeout(() => setStar3(stars >= 3), 1300)

      return () => {
        clearTimeout(timer)
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
  }, [isOpen, isWin, stars])

  const handleRetry = () => {
    resetLevel()
    setGameStatus('playing')
  }

  const handleNextLevel = () => {
    if (currentLevel && hasNextLevel) {
      navigate(`/game/${currentLevel.id + 1}`)
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  const handleWatchAd = () => {
    if (watchAd()) {
      setGameStatus('playing')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-bounce-in">
        {isWin ? (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-lavender mb-2">
                恭喜通关！
              </h2>
              <p className="text-gray-500">压力全部消除啦~</p>
            </div>

            {showStars && (
              <div className="flex justify-center gap-4 mb-6">
                <span
                  className={`text-5xl transition-all duration-300 ${
                    star1 ? 'animate-star-pop' : 'opacity-0'
                  }`}
                >
                  ⭐
                </span>
                <span
                  className={`text-5xl transition-all duration-300 ${
                    star2 ? 'animate-star-pop' : 'opacity-0'
                  }`}
                  style={{ animationDelay: '0.2s' }}
                >
                  ⭐
                </span>
                <span
                  className={`text-5xl transition-all duration-300 ${
                    star3 ? 'animate-star-pop' : 'opacity-0'
                  }`}
                  style={{ animationDelay: '0.4s' }}
                >
                  ⭐
                </span>
              </div>
            )}

            <div className="bg-cream rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">剩余步数</span>
                <span className="font-bold text-lg text-lavender">{movesLeft}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">无效交换</span>
                <span className="font-bold text-lg text-lavender">{invalidSwaps}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">轻松值</span>
                <span className="font-bold text-lg text-coral">+{relaxValue}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {hasNextLevel && (
                <button
                  onClick={handleNextLevel}
                  className="w-full py-3 bg-gradient-to-r from-lavender to-purple-400 text-white rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  下一关 ➡️
                </button>
              )}
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-gradient-to-r from-mint to-green-400 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                再玩一次 🔄
              </button>
              <button
                onClick={handleBack}
                className="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                返回地图 🗺️
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-3xl font-bold text-gray-600 mb-2">
                挑战失败
              </h2>
              <p className="text-gray-500">别灰心，再试一次吧！</p>
            </div>

            <div className="bg-cream rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">剩余步数</span>
                <span className="font-bold text-lg text-red-400">{movesLeft}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">当前轻松值</span>
                <span className="font-bold text-lg text-coral">{relaxValue}</span>
              </div>
            </div>

            {!watchedAd && (
              <button
                onClick={handleWatchAd}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl font-bold mb-3 hover:scale-105 active:scale-95 transition-transform"
              >
                📺 观看广告 +3 步
              </button>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-gradient-to-r from-lavender to-purple-400 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                重新挑战 🔄
              </button>
              <button
                onClick={handleBack}
                className="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                返回地图 🗺️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ResultModal
