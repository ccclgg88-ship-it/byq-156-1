import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { COLOR_MAP } from '../types'

const MapPage = () => {
  const navigate = useNavigate()
  const { getAllLevels, getLevelProgress, save } = useGameStore()

  const levels = getAllLevels()

  const isLevelUnlocked = (levelId: number): boolean => {
    if (levelId === 1) return true
    const prevProgress = getLevelProgress(levelId - 1)
    return prevProgress ? prevProgress.completed : false
  }

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-1 justify-center mt-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-lg ${
              i <= stars ? 'text-yellow-400 drop-shadow-md' : 'text-gray-300'
            }`}
          >
            ⭐
          </span>
        ))}
      </div>
    )
  }

  const petEmojis = ['🐱', '🐶', '🐷', '🐟', '🍀', '🍊']

  return (
    <div className="w-full h-full bg-gradient-to-b from-lavender/30 via-cream to-peach/30 flex flex-col items-center py-6 overflow-auto">
      <div className="text-center mb-6 animate-float">
        <h1 className="text-4xl font-bold text-lavender drop-shadow-lg mb-2">
          🫧 压力气泡消消乐 🫧
        </h1>
        <p className="text-gray-600">和圆嘟嘟宠物一起释放压力吧！</p>
      </div>

      <div className="flex items-center gap-4 mb-6 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
        <span className="text-2xl">💖</span>
        <div>
          <p className="text-sm text-gray-500">累计轻松值</p>
          <p className="text-xl font-bold text-coral">{save.totalRelaxValue}</p>
        </div>
      </div>

      <div className="w-full max-w-md px-4">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-700">
          🗺️ 关卡地图
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {levels.map((level, index) => {
            const progress = getLevelProgress(level.id)
            const unlocked = isLevelUnlocked(level.id)
            const petEmoji = petEmojis[index % petEmojis.length]

            return (
              <button
                key={level.id}
                onClick={() => unlocked && navigate(`/game/${level.id}`)}
                disabled={!unlocked}
                className={`
                  relative aspect-square rounded-2xl flex flex-col items-center justify-center
                  transition-all duration-300 transform
                  ${unlocked
                    ? 'bg-white shadow-lg hover:scale-110 hover:shadow-xl cursor-pointer active:scale-95'
                    : 'bg-gray-200 opacity-60 cursor-not-allowed'
                  }
                `}
              >
                {unlocked ? (
                  <>
                    <div className="text-3xl mb-1 animate-float" style={{ animationDelay: `${index * 0.1}s` }}>
                      {petEmoji}
                    </div>
                    <span className="text-lg font-bold text-gray-700">
                      第 {level.id} 关
                    </span>
                    {progress && renderStars(progress.stars)}
                    {level.bonusMoves && (
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs px-2 py-1 rounded-full text-white font-bold shadow-md">
                        +{level.bonusMoves}步
                      </span>
                    )}
                  </>
                ) : (
                  <div className="text-4xl">🔒</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>💡 小提示：</p>
        <p>形成四消、五消或L/T形消除会产生特殊气泡哦！</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {Object.entries(COLOR_MAP).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-1 bg-white/60 rounded-full px-3 py-1 text-sm"
          >
            <span>{value.emoji}</span>
            <span className="text-gray-600">{value.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MapPage
