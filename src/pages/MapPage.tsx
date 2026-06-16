import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useDailyStore } from '../store/dailyStore'
import { COLOR_MAP, DAILY_THEME_NAMES, DAILY_BADGE_ICONS } from '../types'

const MapPage = () => {
  const navigate = useNavigate()
  const { getAllLevels, getLevelProgress, save } = useGameStore()
  const { loadToday, isTodayCompleted, getTodayStars, getStreak, save: dailySave, config } = useDailyStore()

  const levels = getAllLevels()

  useEffect(() => {
    loadToday()
  }, [loadToday])

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
            {'\u2B50'}
          </span>
        ))}
      </div>
    )
  }

  const renderDailyStars = (stars: number) => {
    return (
      <div className="flex gap-0.5 justify-center">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-sm ${i <= stars ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            {'\u2B50'}
          </span>
        ))}
      </div>
    )
  }

  const todayCompleted = isTodayCompleted()
  const todayStars = getTodayStars()
  const streak = getStreak()
  const dayOfWeek = new Date().getDay()
  const badgeIcon = DAILY_BADGE_ICONS[dayOfWeek % DAILY_BADGE_ICONS.length]

  const petEmojis = ['\u{1F431}', '\u{1F436}', '\u{1F437}', '\u{1F41F}', '\u{1F340}', '\u{1F34A}']

  return (
    <div className="w-full h-full bg-gradient-to-b from-lavender/30 via-cream to-peach/30 flex flex-col items-center py-6 overflow-auto">
      <div className="text-center mb-4 animate-float">
        <h1 className="text-4xl font-bold text-lavender drop-shadow-lg mb-2">
          {'\u{1FAE7}'} 压力气泡消消乐 {'\u{1FAE7}'}
        </h1>
        <p className="text-gray-600">和圆嘟嘟宠物一起释放压力吧！</p>
      </div>

      <div className="flex items-center gap-4 mb-4 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
        <span className="text-2xl">{'\u{1F496}'}</span>
        <div>
          <p className="text-sm text-gray-500">累计轻松值</p>
          <p className="text-xl font-bold text-coral">{save.totalRelaxValue}</p>
        </div>
      </div>

      <div
        onClick={() => navigate('/daily')}
        className={`
          w-full max-w-md mx-4 mb-6 rounded-2xl p-4 shadow-lg cursor-pointer
          transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
          ${todayCompleted
            ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300'
            : 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{badgeIcon}</div>
            <div>
              <h3 className="font-bold text-purple-700">
                {'\u{1F31F}'} 今日挑战
              </h3>
              <p className="text-sm text-gray-600">
                {config ? DAILY_THEME_NAMES[config.type] : '加载中...'}
              </p>
            </div>
          </div>
          <div className="text-right">
            {todayCompleted ? (
              <>
                <p className="text-green-600 font-bold text-sm">已完成 {'\u2713'}</p>
                {renderDailyStars(todayStars)}
              </>
            ) : (
              <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                去挑战
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-200/50">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span>{'\u{1F525}'}</span>
            <span>连续 <strong className="text-orange-500">{streak}</strong> 天</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span>{'\u{1F3C6}'}</span>
            <span>累计 <strong className="text-purple-500">{dailySave.totalCompleted}</strong> 次</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span>{'\u{1F48E}'}</span>
            <span>最长 <strong className="text-blue-500">{dailySave.longestStreak}</strong> 天</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-4">
        <h2 className="text-xl font-bold text-center mb-4 text-gray-700">
          {'\u{1F5FA}\uFE0F'} 关卡地图
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
                  <div className="text-4xl">{'\u{1F512}'}</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>{'\u{1F4A1}'} 小提示：</p>
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
