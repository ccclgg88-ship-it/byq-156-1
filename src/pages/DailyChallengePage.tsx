import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDailyStore } from '../store/dailyStore'
import { useGameStore } from '../store/gameStore'
import { COLOR_MAP, BOARD_SIZE, DAILY_THEME_NAMES, MILESTONE_QUOTES } from '../types'
import type { Cell, Position, BubbleColor, SpecialType, Target } from '../types'
import {
  initBoard,
  swapCells,
  findAllMatches,
  getMatchResult,
  applyGravity,
  fillBoard,
  isAdjacent,
  applySpecialBubbleEffect,
  combineSpecials,
  hasValidMoves,
  shuffleBoard,
  updateTargets,
  checkWin,
  cloneBoard,
  removeCells,
} from '../utils/gameEngine'

const CELL_SIZE = 44
const PADDING = 4

const DailyChallengePage = () => {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const isProcessingRef = useRef(false)

  const {
    config,
    board,
    setBoard,
    movesLeft,
    targets,
    relaxValue,
    selectedCell,
    setSelectedCell,
    isAnimating,
    setIsAnimating,
    gameStatus,
    petMood,
    setPetMood,
    invalidSwaps,
    incrementInvalidSwaps,
    shuffleCount,
    undoCount,
    pushUndo,
    popUndo,
    useUndo,
    useShuffle,
    useUltimate,
    decrementMoves,
    setTargets,
    setRelaxValue,
    setMovesLeft,
    comboCount,
    setComboCount,
    loadToday,
    startChallenge,
    resumeChallenge,
    resetChallenge,
    completeChallenge,
    failChallenge,
    showExitConfirm,
    setShowExitConfirm,
    save,
  } = useDailyStore()

  const { updateLevelProgress } = useGameStore()

  useEffect(() => {
    loadToday()
  }, [loadToday])

  useEffect(() => {
    if (config && gameStatus === 'playing' && board[0][0].color === null && !board[0][0].isObstacle) {
      const newBoard = initBoard({
        id: 0,
        moves: config.moves,
        colors: config.colors,
        targets: config.targets,
        obstacles: config.obstacles,
        shuffleLimit: 1,
        maxRelaxValue: config.maxRelaxValue,
      })
      setBoard(newBoard)
    }
  }, [config, gameStatus, board, setBoard])

  const drawBubble = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: BubbleColor,
      special: SpecialType | null,
      isSelected: boolean,
      scale: number = 1
    ) => {
      const colorInfo = COLOR_MAP[color]
      const radius = (size / 2 - 2) * scale
      const centerX = x + size / 2
      const centerY = y + size / 2

      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)

      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      )
      gradient.addColorStop(0, '#ffffff')
      gradient.addColorStop(0.3, colorInfo.fill)
      gradient.addColorStop(1, colorInfo.stroke)

      ctx.fillStyle = gradient
      ctx.fill()
      ctx.strokeStyle = colorInfo.stroke
      ctx.lineWidth = 2
      ctx.stroke()

      if (special) {
        ctx.font = `${radius * 1.1}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        let icon = ''
        if (special === 'rowClear') icon = '\u2194\uFE0F'
        else if (special === 'colClear') icon = '\u2195\uFE0F'
        else if (special === 'bomb') icon = '\u{1F4A5}'
        ctx.fillText(icon, centerX, centerY)
      } else {
        const strokeColor = colorInfo.stroke
        ctx.fillStyle = strokeColor
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'
        ctx.lineWidth = 1

        switch (color) {
          case 'cat': {
            const mainPadRadius = size * 0.22
            ctx.beginPath()
            ctx.ellipse(centerX, centerY + size * 0.08, mainPadRadius, mainPadRadius * 0.85, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            const toeRadius = size * 0.09
            const toePositions = [
              { x: centerX - size * 0.22, y: centerY - size * 0.18 },
              { x: centerX - size * 0.08, y: centerY - size * 0.28 },
              { x: centerX + size * 0.08, y: centerY - size * 0.28 },
              { x: centerX + size * 0.22, y: centerY - size * 0.18 },
            ]
            toePositions.forEach((pos) => {
              ctx.beginPath()
              ctx.ellipse(pos.x, pos.y, toeRadius, toeRadius * 1.1, 0, 0, Math.PI * 2)
              ctx.fill()
              ctx.stroke()
            })
            break
          }
          case 'dog': {
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(-Math.PI / 6)
            const boneLength = size * 0.55
            const boneWidth = size * 0.18
            const endRadius = size * 0.16
            ctx.beginPath()
            ctx.roundRect(-boneLength / 2, -boneWidth / 2, boneLength, boneWidth, boneWidth / 2)
            ctx.fill()
            ctx.stroke()
            const ends = [
              { x: -boneLength / 2, y: -boneWidth / 2 },
              { x: -boneLength / 2, y: boneWidth / 2 },
              { x: boneLength / 2, y: -boneWidth / 2 },
              { x: boneLength / 2, y: boneWidth / 2 },
            ]
            ends.forEach((end) => {
              ctx.beginPath()
              ctx.arc(end.x, end.y, endRadius, 0, Math.PI * 2)
              ctx.fill()
              ctx.stroke()
            })
            ctx.restore()
            break
          }
          case 'pig': {
            const noseWidth = size * 0.5
            const noseHeight = size * 0.38
            ctx.beginPath()
            ctx.ellipse(centerX, centerY, noseWidth / 2, noseHeight / 2, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            ctx.fillStyle = 'rgba(120,60,60,0.7)'
            const nostrilWidth = size * 0.1
            const nostrilHeight = size * 0.16
            const nostrilSpacing = size * 0.13
            ctx.beginPath()
            ctx.ellipse(centerX - nostrilSpacing, centerY, nostrilWidth, nostrilHeight, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.ellipse(centerX + nostrilSpacing, centerY, nostrilWidth, nostrilHeight, 0, 0, Math.PI * 2)
            ctx.fill()
            break
          }
          case 'fish': {
            const bodyWidth = size * 0.4
            const bodyHeight = size * 0.28
            ctx.beginPath()
            ctx.ellipse(centerX - size * 0.05, centerY, bodyWidth / 2, bodyHeight / 2, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(centerX + size * 0.12, centerY)
            ctx.lineTo(centerX + size * 0.32, centerY - size * 0.18)
            ctx.lineTo(centerX + size * 0.32, centerY + size * 0.18)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(centerX - size * 0.18, centerY - size * 0.02, size * 0.04, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#333'
            ctx.beginPath()
            ctx.arc(centerX - size * 0.18, centerY - size * 0.02, size * 0.025, 0, Math.PI * 2)
            ctx.fill()
            break
          }
          case 'clover': {
            const leafRadius = size * 0.14
            const leafOffset = size * 0.12
            const leaves = [
              { x: centerX, y: centerY - leafOffset },
              { x: centerX - leafOffset, y: centerY },
              { x: centerX + leafOffset, y: centerY },
              { x: centerX, y: centerY + leafOffset },
            ]
            leaves.forEach((leaf) => {
              ctx.beginPath()
              ctx.arc(leaf.x, leaf.y, leafRadius, 0, Math.PI * 2)
              ctx.fill()
              ctx.stroke()
            })
            break
          }
          case 'orange': {
            const heartSize = size * 0.28
            ctx.beginPath()
            ctx.moveTo(centerX, centerY + heartSize * 0.4)
            ctx.bezierCurveTo(centerX, centerY + heartSize * 0.1, centerX - heartSize * 0.5, centerY - heartSize * 0.2, centerX - heartSize * 0.5, centerY)
            ctx.bezierCurveTo(centerX - heartSize * 0.5, centerY + heartSize * 0.3, centerX, centerY + heartSize * 0.55, centerX, centerY + heartSize * 0.55)
            ctx.bezierCurveTo(centerX, centerY + heartSize * 0.55, centerX + heartSize * 0.5, centerY + heartSize * 0.3, centerX + heartSize * 0.5, centerY)
            ctx.bezierCurveTo(centerX + heartSize * 0.5, centerY - heartSize * 0.2, centerX, centerY + heartSize * 0.1, centerX, centerY + heartSize * 0.4)
            ctx.fill()
            ctx.stroke()
            break
          }
        }
      }

      if (isSelected) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2)
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.restore()
    },
    []
  )

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16)
    ctx.fill()

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = board[row][col]
        const x = col * CELL_SIZE + PADDING
        const y = row * CELL_SIZE + PADDING
        const cellDrawSize = CELL_SIZE - PADDING * 2

        if (cell.isObstacle) {
          ctx.save()
          ctx.fillStyle = '#8B7355'
          ctx.beginPath()
          ctx.roundRect(x + 2, y + 2, cellDrawSize - 4, cellDrawSize - 4, 8)
          ctx.fill()
          ctx.strokeStyle = '#6B5344'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.fillStyle = '#6B5344'
          ctx.font = `${cellDrawSize * 0.4}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('\u{1FAA8}', x + cellDrawSize / 2, y + cellDrawSize / 2)
          ctx.restore()
          continue
        }

        if (!cell.color) continue
        const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col
        drawBubble(ctx, x, y, cellDrawSize, cell.color, cell.special, isSelected || false)
      }
    }
  }, [board, selectedCell, drawBubble])

  useEffect(() => {
    render()
  }, [render])

  const processMatches = useCallback(
    async (currentBoard: Cell[][]): Promise<{ board: Cell[][]; totalEliminated: number; specialCollected: number }> => {
      let workingBoard = cloneBoard(currentBoard)
      let totalEliminated = 0
      let specialCollected = 0
      let chainCount = 0

      const processChain = async (): Promise<boolean> => {
        const matches = findAllMatches(workingBoard)
        if (matches.length === 0) return false

        chainCount++
        setComboCount(chainCount)

        if (chainCount > 1) {
          setPetMood('cheer')
          setTimeout(() => setPetMood('idle'), 1000)
        }

        const matchResult = getMatchResult(workingBoard, matches)

        const specialPositions: Position[] = []
        matchResult.positions.forEach((pos) => {
          if (workingBoard[pos.row][pos.col].special) {
            specialPositions.push(pos)
          }
        })

        let allAffected = new Set<string>()
        matchResult.positions.forEach((p) => allAffected.add(`${p.row},${p.col}`))

        specialPositions.forEach((pos) => {
          const specialType = workingBoard[pos.row][pos.col].special
          if (specialType) {
            const affected = applySpecialBubbleEffect(workingBoard, pos, specialType)
            affected.forEach((p) => allAffected.add(`${p.row},${p.col}`))
            specialCollected++
          }
        })

        const affectedPositions: Position[] = []
        allAffected.forEach((key) => {
          const [row, col] = key.split(',').map(Number)
          affectedPositions.push({ row, col })
        })

        totalEliminated += affectedPositions.length

        affectedPositions.forEach((pos) => {
          if (!workingBoard[pos.row][pos.col].isObstacle) {
            workingBoard[pos.row][pos.col].color = null
            workingBoard[pos.row][pos.col].special = null
          }
        })

        matchResult.specialToCreate.forEach(({ pos, special }) => {
          if (allAffected.has(`${pos.row},${pos.col}`)) {
            const cell = workingBoard[pos.row][pos.col]
            if (cell.color && !cell.isObstacle) {
              cell.special = special
            }
          }
        })

        setBoard(cloneBoard(workingBoard))

        const { board: gravityBoard, drops } = applyGravity(workingBoard)
        workingBoard = gravityBoard

        if (config) {
          const { board: filledBoard } = fillBoard(workingBoard, config.colors)
          workingBoard = filledBoard
        }

        setBoard(cloneBoard(workingBoard))
        return true
      }

      while (await processChain()) {
        // chain continues
      }

      setComboCount(0)
      return { board: workingBoard, totalEliminated, specialCollected }
    },
    [config, setBoard, setComboCount, setPetMood]
  )

  const handleCellClick = useCallback(
    async (row: number, col: number) => {
      if (isAnimating || gameStatus !== 'playing' || isProcessingRef.current || !config) return

      const cell = board[row][col]
      if (cell.isObstacle || !cell.color) return

      if (!selectedCell) {
        setSelectedCell({ row, col })
        return
      }

      if (selectedCell.row === row && selectedCell.col === col) {
        setSelectedCell(null)
        return
      }

      if (!isAdjacent(selectedCell, { row, col })) {
        setSelectedCell({ row, col })
        return
      }

      isProcessingRef.current = true
      setIsAnimating(true)

      const pos1 = selectedCell
      const pos2 = { row, col }
      const cell1 = board[pos1.row][pos1.col]
      const cell2 = board[pos2.row][pos2.col]
      const bothSpecial = cell1.special && cell2.special

      pushUndo({
        board: cloneBoard(board),
        movesLeft,
        targets: targets.map((t) => ({ ...t })),
        relaxValue,
      })

      let swappedBoard = swapCells(board, pos1, pos2)
      setBoard(swappedBoard)

      if (bothSpecial) {
        const { affectedPositions } = combineSpecials(swappedBoard, pos1, pos2)
        if (affectedPositions.length > 0) {
          decrementMoves()

          const eliminatedColors = new Map<BubbleColor, number>()
          let specCollected = 0
          affectedPositions.forEach((pos) => {
            const c = swappedBoard[pos.row][pos.col]
            if (c.color) eliminatedColors.set(c.color, (eliminatedColors.get(c.color) || 0) + 1)
            if (c.special) specCollected++
          })

          swappedBoard = removeCells(swappedBoard, affectedPositions)
          const { board: finalBoard } = await processMatches(swappedBoard)

          const newTargets = updateTargets(targets, eliminatedColors, specCollected)
          setTargets(newTargets)

          const bonus = Math.floor(affectedPositions.length * 1.2)
          const newRelax = Math.min(config.maxRelaxValue, relaxValue + bonus)
          setRelaxValue(newRelax)

          if (checkWin(newTargets)) {
            completeChallenge(movesLeft - 1, invalidSwaps)
          } else if (movesLeft - 1 <= 0) {
            failChallenge()
          }
        }

        isProcessingRef.current = false
        setIsAnimating(false)
        setSelectedCell(null)
        return
      }

      const matches = findAllMatches(swappedBoard)

      if (matches.length === 0) {
        incrementInvalidSwaps()
        setPetMood('tense')
        setTimeout(() => setPetMood('idle'), 500)

        setBoard(board)
        setSelectedCell(null)
        isProcessingRef.current = false
        setIsAnimating(false)
        return
      }

      decrementMoves()

      const { board: finalBoard, totalEliminated, specialCollected: specCollected } = await processMatches(swappedBoard)

      const eliminatedColors = new Map<BubbleColor, number>()
      matches.forEach((match) => {
        const color = board[match.positions[0].row][match.positions[0].col].color
        if (color) {
          eliminatedColors.set(color, (eliminatedColors.get(color) || 0) + match.length)
        }
      })

      const newTargets = updateTargets(targets, eliminatedColors, specCollected)
      setTargets(newTargets)

      const bonus = Math.floor(totalEliminated * 1.2)
      const newRelax = Math.min(config.maxRelaxValue, relaxValue + bonus)
      setRelaxValue(newRelax)

      if (checkWin(newTargets)) {
        completeChallenge(movesLeft - 1, invalidSwaps)
      } else if (movesLeft - 1 <= 0) {
        failChallenge()
      } else if (!hasValidMoves(finalBoard)) {
        if (useShuffle()) {
          const shuffled = shuffleBoard(finalBoard, config.colors)
          setBoard(shuffled)
        } else {
          failChallenge()
        }
      }

      setSelectedCell(null)
      isProcessingRef.current = false
      setIsAnimating(false)
    },
    [
      board, selectedCell, isAnimating, gameStatus, config,
      setSelectedCell, setIsAnimating, processMatches,
      pushUndo, movesLeft, targets, relaxValue, setBoard,
      setTargets, setRelaxValue, decrementMoves, incrementInvalidSwaps,
      invalidSwaps, setPetMood, completeChallenge, failChallenge, useShuffle,
    ]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor(x / CELL_SIZE)
      const row = Math.floor(y / CELL_SIZE)
      if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        handleCellClick(row, col)
      }
    },
    [handleCellClick]
  )

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
    if (!useShuffle() || !config) return
    const shuffled = shuffleBoard(board, config.colors)
    setBoard(shuffled)
  }

  const handleUltimate = () => {
    if (!useUltimate(board)) return
    const colorCount = new Map<BubbleColor, number>()
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const color = board[row][col].color
        if (color) colorCount.set(color, (colorCount.get(color) || 0) + 1)
      }
    }
    let maxColor: BubbleColor | null = null
    let maxCount = 0
    colorCount.forEach((count, color) => {
      if (count > maxCount) { maxCount = count; maxColor = color }
    })
    if (maxColor) {
      const newBoard = cloneBoard(board)
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (newBoard[row][col].color === maxColor && !newBoard[row][col].isObstacle) {
            newBoard[row][col].color = null
            newBoard[row][col].special = null
          }
        }
      }
      setBoard(newBoard)
      setPetMood('cheer')
    }
  }

  const handleBack = () => {
    if (gameStatus === 'playing') {
      setShowExitConfirm(true)
    } else {
      navigate('/')
    }
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  if (!config) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (gameStatus === 'preview') {
    const todayCompleted = save.completed && save.currentDate === new Date().toISOString().split('T')[0]

    return (
      <div className="w-full h-full bg-gradient-to-b from-purple-100/50 via-cream to-pink-100/50 flex flex-col items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-sm w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{todayCompleted ? '\u{1F3C6}' : '\u{1F31F}'}</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">{config.title}</h2>
            <p className="text-gray-500">今日主题：{DAILY_THEME_NAMES[config.type]}</p>
          </div>

          {todayCompleted && (
            <div className="bg-green-50 rounded-2xl p-4 mb-4 border-2 border-green-200">
              <div className="text-center">
                <p className="font-bold text-green-600 mb-2">{'\u2728'} 今日已完成</p>
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`text-3xl ${i <= save.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      {'\u2B50'}
                    </span>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <span>剩余步数: <strong>{save.bestMovesLeft}</strong></span>
                  <span>连续: <strong className="text-orange-500">{save.streak}</strong> 天</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-purple-50 rounded-2xl p-4 mb-6">
            <h3 className="font-bold text-purple-700 mb-3">{'\u{1F3AF}'} 挑战规则</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{'\u{1F4AA}'} 步数限制：{config.moves} 步</p>
              <div>
                <p className="font-medium">目标：</p>
                {config.targets.map((target, i) => (
                  <p key={i} className="ml-2">
                    {target.type === 'eliminate' && target.color
                      ? `消除 ${COLOR_MAP[target.color].label} x${target.count}`
                      : `收集特殊气泡 x${target.count}`}
                  </p>
                ))}
              </div>
              {config.obstacles.length > 0 && (
                <p>{'\u{1FAA8}'} 障碍物：{config.obstacles.length} 个</p>
              )}
              <p>{'\u{1F504}'} 洗牌限 1 次 | {'\u{21A9}\uFE0F'} 撤销限 1 次</p>
              <p>{'\u{1F4F1}'} 不可看广告加步</p>
            </div>
          </div>

          {save.ongoingGame && (
            <button
              onClick={resumeChallenge}
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-bold mb-3 hover:scale-105 active:scale-95 transition-transform"
            >
              {'\u{25B6}\uFE0F'} 继续挑战
            </button>
          )}

          {!todayCompleted && (
            <button
              onClick={startChallenge}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              {'\u{1F680}'} 开始挑战
            </button>
          )}

          {todayCompleted && (
            <button
              onClick={startChallenge}
              className="w-full py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              {'\u{1F504}'} 再玩一次
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 mt-3 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            返回地图
          </button>
        </div>
      </div>
    )
  }

  const isWin = gameStatus === 'win'
  const isLose = gameStatus === 'lose'
  const canUseUltimate = config && relaxValue >= config.maxRelaxValue && !useDailyStore.getState().usedUltimate

  return (
    <div className="w-full h-full bg-gradient-to-b from-purple-100/30 via-cream to-pink-100/30 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-purple-500/80 backdrop-blur-sm shadow-md">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-white hover:bg-white/50 transition-colors"
        >
          {'\u2190'}
        </button>
        <div className="text-center text-white">
          <h1 className="text-lg font-bold">{config.title}</h1>
          <p className="text-xs text-purple-100">
            步数: <span className="font-bold">{movesLeft}</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{comboCount > 1 ? `${comboCount}连击` : '\u{1F4AB}'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 overflow-auto">
        <div className="w-full max-w-xs">
          <p className="text-sm font-bold text-gray-600 mb-2 text-center">{'\u{1F3AF}'} 目标</p>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 flex flex-wrap gap-2 justify-center">
            {targets.map((target, index) => (
              <div
                key={index}
                className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                  target.current >= target.count ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {target.type === 'eliminate' && target.color && <span>{COLOR_MAP[target.color].emoji}</span>}
                {target.type === 'collectSpecial' && <span>{'\u2728'}</span>}
                <span className="text-sm font-medium">{target.current}/{target.count}</span>
                {target.current >= target.count && <span>{'\u2713'}</span>}
              </div>
            ))}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={CELL_SIZE * BOARD_SIZE}
          height={CELL_SIZE * BOARD_SIZE}
          onClick={handleCanvasClick}
          className="rounded-2xl shadow-xl cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,248,238,0.9) 100%)',
          }}
        />

        <div className="flex gap-3">
          <button
            onClick={handleUndo}
            disabled={undoCount <= 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              undoCount > 0 ? 'bg-blue-400 text-white hover:bg-blue-500 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {'\u21A9\uFE0F'} 撤销 ({undoCount})
          </button>
          <button
            onClick={handleShuffle}
            disabled={shuffleCount >= 1}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              shuffleCount < 1 ? 'bg-orange-400 text-white hover:bg-orange-500 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {'\u{1F500}'} 洗牌 ({1 - shuffleCount})
          </button>
        </div>

        <div className="w-full max-w-xs bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-4xl ${petMood === 'cheer' ? 'animate-bounce' : petMood === 'tense' ? 'animate-shake' : 'animate-float'}`}>
              {petMood === 'cheer' ? '\u{1F389}' : petMood === 'tense' ? '\u{1F630}' : '\u{1F431}'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-700">咪咪助手</p>
              <p className="text-xs text-gray-500">和你一起消除压力~</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{'\u{1F496}'} 轻松值</span>
              <span className="font-bold text-purple-500">{relaxValue} / {config.maxRelaxValue}</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, (relaxValue / config.maxRelaxValue) * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleUltimate}
            disabled={!canUseUltimate}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 ${
              canUseUltimate
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 active:scale-95 animate-pulse-glow cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {'\u{1F31F}'} 宠物大招
          </button>
        </div>
      </div>

      {(isWin || isLose) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-bounce-in">
            {isWin ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{'\u{1F389}'}</div>
                  <h2 className="text-3xl font-bold text-purple-600 mb-2">挑战成功！</h2>
                  <p className="text-gray-500">今日压力已全部消除~</p>
                </div>

                <div className="flex justify-center gap-4 mb-4">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`text-4xl ${i <= save.stars ? 'animate-star-pop' : 'opacity-30'}`}
                    >
                      {'\u2B50'}
                    </span>
                  ))}
                </div>

                <div className="bg-purple-50 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">剩余步数</span>
                    <span className="font-bold text-lg text-purple-600">{movesLeft}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">连续天数</span>
                    <span className="font-bold text-lg text-orange-500">{save.streak} 天</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">累计完成</span>
                    <span className="font-bold text-lg text-purple-600">{save.totalCompleted} 次</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">获得轻松值</span>
                    <span className="font-bold text-lg text-coral">+{relaxValue}</span>
                  </div>
                </div>

                {[3, 7, 30].map((milestone) => {
                  if (save.streak === milestone && MILESTONE_QUOTES[milestone]) {
                    return (
                      <div key={milestone} className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-4 text-center animate-bounce-in">
                        <div className="text-3xl mb-2">{'\u{1F525}'}</div>
                        <p className="font-bold text-yellow-700">{milestone}天里程碑！</p>
                        <p className="text-sm text-yellow-600">{MILESTONE_QUOTES[milestone]}</p>
                      </div>
                    )
                  }
                  return null
                })}

                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
                >
                  返回地图 {'\u{1F5FA}\uFE0F'}
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{'\u{1F622}'}</div>
                  <h2 className="text-3xl font-bold text-gray-600 mb-2">挑战失败</h2>
                  <p className="text-gray-500">明天再来，别灰心！</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">当前连续天数</span>
                    <span className="font-bold text-lg text-orange-500">{save.streak} 天</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={resetChallenge}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
                  >
                    重新挑战 {'\u{1F504}'}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  >
                    返回地图 {'\u{1F5FA}\uFE0F'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{'\u{26A0}\uFE0F'}</div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">确认退出？</h2>
              <p className="text-gray-500 text-sm">当前挑战进度将会保存，你可以稍后继续。</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                继续挑战
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false)
                  navigate('/')
                }}
                className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyChallengePage
