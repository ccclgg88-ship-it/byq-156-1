import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { COLOR_MAP, BOARD_SIZE } from '../types'
import type { Cell, Position, BubbleColor, SpecialType } from '../types'
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
  getStars,
  cloneBoard,
  removeCells,
} from '../utils/gameEngine'

interface GameBoardProps {
  cellSize?: number
}

interface AnimatedCell {
  row: number
  col: number
  offsetY: number
  opacity: number
  scale: number
  targetOffsetY?: number
  isNew?: boolean
}

const GameBoard = ({ cellSize = 48 }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const animatedCellsRef = useRef<Map<string, AnimatedCell>>(new Map())
  const isProcessingRef = useRef(false)

  const {
    board,
    setBoard,
    currentLevel,
    selectedCell,
    setSelectedCell,
    movesLeft,
    decrementMoves,
    setTargets,
    targets,
    relaxValue,
    setRelaxValue,
    petMood,
    setPetMood,
    isAnimating,
    setIsAnimating,
    gameStatus,
    setGameStatus,
    invalidSwaps,
    incrementInvalidSwaps,
    pushUndo,
    comboCount,
    setComboCount,
    updateLevelProgress,
    shuffleCount,
    useShuffle,
  } = useGameStore()

  const boardPixelSize = cellSize * BOARD_SIZE
  const padding = 4

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
        if (special === 'rowClear') icon = '↔️'
        else if (special === 'colClear') icon = '↕️'
        else if (special === 'bomb') icon = '💥'

        ctx.fillText(icon, centerX, centerY)
      } else {
        ctx.font = `${radius * 0.9}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(colorInfo.emoji, centerX, centerY)
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

  const drawObstacle = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const padding = 2
      ctx.save()
      ctx.fillStyle = '#8B7355'
      ctx.beginPath()
      ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, 8)
      ctx.fill()

      ctx.strokeStyle = '#6B5344'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#6B5344'
      ctx.font = `${size * 0.4}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🪨', x + size / 2, y + size / 2)

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
        const x = col * cellSize + padding
        const y = row * cellSize + padding
        const cellDrawSize = cellSize - padding * 2

        if (cell.isObstacle) {
          drawObstacle(ctx, x, y, cellDrawSize)
          continue
        }

        if (!cell.color) continue

        const key = `${row},${col}`
        const animated = animatedCellsRef.current.get(key)

        let offsetY = 0
        let opacity = 1
        let scale = 1

        if (animated) {
          offsetY = animated.offsetY
          opacity = animated.opacity
          scale = animated.scale
        }

        const isSelected =
          selectedCell && selectedCell.row === row && selectedCell.col === col

        ctx.save()
        ctx.globalAlpha = opacity
        drawBubble(
          ctx,
          x,
          y + offsetY,
          cellDrawSize,
          cell.color,
          cell.special,
          isSelected || false,
          scale
        )
        ctx.restore()
      }
    }
  }, [board, cellSize, selectedCell, drawBubble, drawObstacle])

  useEffect(() => {
    if (currentLevel && gameStatus === 'playing' && board[0][0].color === null && !board[0][0].isObstacle) {
      const newBoard = initBoard(currentLevel)
      setBoard(newBoard)
    }
  }, [currentLevel, gameStatus, board, setBoard])

  const animateSwap = useCallback(
    (pos1: Position, pos2: Position, onComplete: () => void) => {
      const duration = 200
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)

        const cell1Size = cellSize - padding * 2
        const cell2Size = cellSize - padding * 2

        const offset1 = {
          x: (pos2.col - pos1.col) * cellSize * eased,
          y: (pos2.row - pos1.row) * cellSize * eased,
        }
        const offset2 = {
          x: (pos1.col - pos2.col) * cellSize * eased,
          y: (pos1.row - pos2.row) * cellSize * eased,
        }

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
            const x = col * cellSize + padding
            const y = row * cellSize + padding
            const cellDrawSize = cellSize - padding * 2

            if (cell.isObstacle) {
              drawObstacle(ctx, x, y, cellDrawSize)
              continue
            }

            if (!cell.color) continue

            const isPos1 = row === pos1.row && col === pos1.col
            const isPos2 = row === pos2.row && col === pos2.col

            if (isPos1 || isPos2) continue

            drawBubble(ctx, x, y, cellDrawSize, cell.color, cell.special, false)
          }
        }

        const cell1 = board[pos1.row][pos1.col]
        const cell2 = board[pos2.row][pos2.col]

        if (cell1.color) {
          const x1 = pos1.col * cellSize + padding + offset1.x
          const y1 = pos1.row * cellSize + padding + offset1.y
          drawBubble(ctx, x1, y1, cell1Size, cell1.color, cell1.special, false)
        }

        if (cell2.color) {
          const x2 = pos2.col * cellSize + padding + offset2.x
          const y2 = pos2.row * cellSize + padding + offset2.y
          drawBubble(ctx, x2, y2, cell2Size, cell2.color, cell2.special, false)
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          onComplete()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [board, cellSize, drawBubble, drawObstacle]
  )

  const animateElimination = useCallback(
    (positions: Position[], onComplete: () => void) => {
      const duration = 300
      const startTime = performance.now()

      const posSet = new Set(positions.map((p) => `${p.row},${p.col}`))

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const scale = 1 - progress * 0.5
        const opacity = 1 - progress

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
            const x = col * cellSize + padding
            const y = row * cellSize + padding
            const cellDrawSize = cellSize - padding * 2
            const key = `${row},${col}`

            if (cell.isObstacle) {
              drawObstacle(ctx, x, y, cellDrawSize)
              continue
            }

            if (!cell.color) continue

            const isEliminating = posSet.has(key)

            if (isEliminating) {
              ctx.save()
              ctx.globalAlpha = opacity
              drawBubble(ctx, x, y, cellDrawSize, cell.color, cell.special, false, scale)
              ctx.restore()
            } else {
              drawBubble(ctx, x, y, cellDrawSize, cell.color, cell.special, false)
            }
          }
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          onComplete()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [board, cellSize, drawBubble, drawObstacle]
  )

  const animateDrop = useCallback(
    (drops: { from: Position; to: Position }[], newBoard: Cell[][], onComplete: () => void) => {
      const duration = 300
      const startTime = performance.now()

      const dropMap = new Map<string, { from: Position; to: Position; distance: number }>()

      drops.forEach((drop) => {
        const key = `${drop.to.row},${drop.to.col}`
        const distance = (drop.to.row - drop.from.row) * cellSize
        dropMap.set(key, { ...drop, distance })
      })

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)

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
            const cell = newBoard[row][col]
            const x = col * cellSize + padding
            const y = row * cellSize + padding
            const cellDrawSize = cellSize - padding * 2
            const key = `${row},${col}`

            if (cell.isObstacle) {
              drawObstacle(ctx, x, y, cellDrawSize)
              continue
            }

            if (!cell.color) continue

            const drop = dropMap.get(key)
            let offsetY = 0

            if (drop) {
              offsetY = -drop.distance * (1 - eased)
            }

            drawBubble(ctx, x, y + offsetY, cellDrawSize, cell.color, cell.special, false)
          }
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          onComplete()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [cellSize, drawBubble, drawObstacle]
  )

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

        await new Promise<void>((resolve) => {
          animateElimination(affectedPositions, resolve)
        })

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

        await new Promise<void>((resolve) => {
          animateDrop(drops, workingBoard, resolve)
        })

        if (currentLevel) {
          const { board: filledBoard, newCells } = fillBoard(workingBoard, currentLevel.colors)
          workingBoard = filledBoard

          if (newCells.length > 0) {
            newCells.forEach((pos) => {
              const key = `${pos.row},${pos.col}`
              animatedCellsRef.current.set(key, {
                row: pos.row,
                col: pos.col,
                offsetY: -cellSize * 3,
                opacity: 1,
                scale: 1,
                isNew: true,
              })
            })

            await new Promise<void>((resolve) => {
              const duration = 300
              const startTime = performance.now()

              const animNew = (currentTime: number) => {
                const elapsed = currentTime - startTime
                const progress = Math.min(elapsed / duration, 1)
                const eased = 1 - Math.pow(1 - progress, 3)

                newCells.forEach((pos) => {
                  const key = `${pos.row},${pos.col}`
                  const anim = animatedCellsRef.current.get(key)
                  if (anim) {
                    anim.offsetY = -cellSize * 3 * (1 - eased)
                    animatedCellsRef.current.set(key, anim)
                  }
                })

                render()

                if (progress < 1) {
                  requestAnimationFrame(animNew)
                } else {
                  newCells.forEach((pos) => {
                    const key = `${pos.row},${pos.col}`
                    animatedCellsRef.current.delete(key)
                  })
                  resolve()
                }
              }

              requestAnimationFrame(animNew)
            })
          }
        }

        setBoard(cloneBoard(workingBoard))

        return true
      }

      while (await processChain()) {
        // 继续连锁
      }

      setComboCount(0)

      return { board: workingBoard, totalEliminated, specialCollected }
    },
    [animateElimination, animateDrop, cellSize, currentLevel, render, setBoard, setComboCount, setPetMood]
  )

  const handleCellClick = useCallback(
    async (row: number, col: number) => {
      if (isAnimating || gameStatus !== 'playing' || isProcessingRef.current) return

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

      await new Promise<void>((resolve) => {
        animateSwap(pos1, pos2, resolve)
      })

      let swappedBoard = swapCells(board, pos1, pos2)
      setBoard(swappedBoard)

      if (bothSpecial) {
        const { affectedPositions, isCrossBomb } = combineSpecials(swappedBoard, pos1, pos2)

        if (affectedPositions.length > 0) {
          decrementMoves()

          await new Promise<void>((resolve) => {
            animateElimination(affectedPositions, resolve)
          })

          const eliminatedColors = new Map<BubbleColor, number>()
          let specialCollected = 0

          affectedPositions.forEach((pos) => {
            const cell = swappedBoard[pos.row][pos.col]
            if (cell.color) {
              eliminatedColors.set(cell.color, (eliminatedColors.get(cell.color) || 0) + 1)
            }
            if (cell.special) {
              specialCollected++
            }
          })

          swappedBoard = removeCells(swappedBoard, affectedPositions)

          const { board: finalBoard, totalEliminated } = await processMatches(swappedBoard)
          swappedBoard = finalBoard

          const newTargets = updateTargets(targets, eliminatedColors, specialCollected)
          setTargets(newTargets)

          const bonus = Math.floor((totalEliminated + affectedPositions.length) * 1.2)
          const newRelax = Math.min((currentLevel?.maxRelaxValue || 100), relaxValue + bonus)
          setRelaxValue(newRelax)

          if (checkWin(newTargets)) {
            const stars = getStars(movesLeft - 1, invalidSwaps, true)
            updateLevelProgress(currentLevel?.id || 1, stars, newRelax)
            setGameStatus('win')
          } else if (movesLeft - 1 <= 0) {
            setGameStatus('lose')
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

        await new Promise<void>((resolve) => {
          animateSwap(pos2, pos1, resolve)
        })

        setBoard(board)
        setSelectedCell(null)
        isProcessingRef.current = false
        setIsAnimating(false)
        return
      }

      decrementMoves()

      const { board: finalBoard, totalEliminated, specialCollected } = await processMatches(swappedBoard)

      const eliminatedColors = new Map<BubbleColor, number>()
      matches.forEach((match) => {
        const color = board[match.positions[0].row][match.positions[0].col].color
        if (color) {
          const current = eliminatedColors.get(color) || 0
          eliminatedColors.set(color, current + match.length)
        }
      })

      const newTargets = updateTargets(targets, eliminatedColors, specialCollected)
      setTargets(newTargets)

      const bonus = Math.floor(totalEliminated * 1.2)
      const newRelax = Math.min((currentLevel?.maxRelaxValue || 100), relaxValue + bonus)
      setRelaxValue(newRelax)

      if (checkWin(newTargets)) {
        const stars = getStars(movesLeft - 1, invalidSwaps, true)
        updateLevelProgress(currentLevel?.id || 1, stars, newRelax)
        setGameStatus('win')
      } else if (movesLeft - 1 <= 0) {
        setGameStatus('lose')
      } else if (!hasValidMoves(finalBoard)) {
        if (useShuffle()) {
          const shuffled = shuffleBoard(finalBoard, currentLevel?.colors || [])
          setBoard(shuffled)
        } else {
          setGameStatus('lose')
        }
      }

      setSelectedCell(null)
      isProcessingRef.current = false
      setIsAnimating(false)
    },
    [
      board,
      selectedCell,
      isAnimating,
      gameStatus,
      setSelectedCell,
      setIsAnimating,
      animateSwap,
      animateElimination,
      processMatches,
      pushUndo,
      movesLeft,
      targets,
      relaxValue,
      setBoard,
      setTargets,
      setRelaxValue,
      decrementMoves,
      incrementInvalidSwaps,
      invalidSwaps,
      currentLevel,
      setGameStatus,
      updateLevelProgress,
      setPetMood,
      useShuffle,
      shuffleBoard,
    ]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const col = Math.floor(x / cellSize)
      const row = Math.floor(y / cellSize)

      if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        handleCellClick(row, col)
      }
    },
    [cellSize, handleCellClick]
  )

  useEffect(() => {
    render()
  }, [render])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={boardPixelSize}
      height={boardPixelSize}
      onClick={handleCanvasClick}
      className="rounded-2xl shadow-xl cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,248,238,0.9) 100%)',
      }}
    />
  )
}

export default GameBoard
