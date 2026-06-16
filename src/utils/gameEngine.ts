import type { Cell, Position, MatchGroup, BubbleColor, SpecialType, Target, LevelConfig } from '../types'
import { BOARD_SIZE } from '../types'

export const cloneBoard = (board: Cell[][]): Cell[][] => {
  return board.map((row) => row.map((cell) => ({ ...cell })))
}

export const getRandomColor = (colors: BubbleColor[]): BubbleColor => {
  return colors[Math.floor(Math.random() * colors.length)]
}

export const initBoard = (level: LevelConfig): Cell[][] => {
  const board: Cell[][] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = []
    for (let col = 0; col < BOARD_SIZE; col++) {
      const isObstacle = level.obstacles.some((o) => o.row === row && o.col === col)
      board[row][col] = {
        color: null,
        special: null,
        isObstacle,
      }
    }
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].isObstacle) continue

      let color: BubbleColor
      let attempts = 0
      do {
        color = getRandomColor(level.colors)
        attempts++
      } while (wouldCreateMatch(board, row, col, color) && attempts < 50)

      board[row][col].color = color
    }
  }

  return board
}

const wouldCreateMatch = (board: Cell[][], row: number, col: number, color: BubbleColor): boolean => {
  if (col >= 2 && board[row][col - 1].color === color && board[row][col - 2].color === color) {
    return true
  }
  if (row >= 2 && board[row - 1][col].color === color && board[row - 2][col].color === color) {
    return true
  }
  return false
}

export const isAdjacent = (pos1: Position, pos2: Position): boolean => {
  const rowDiff = Math.abs(pos1.row - pos2.row)
  const colDiff = Math.abs(pos1.col - pos2.col)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

export const swapCells = (board: Cell[][], pos1: Position, pos2: Position): Cell[][] => {
  const newBoard = cloneBoard(board)
  const temp = { ...newBoard[pos1.row][pos1.col] }
  newBoard[pos1.row][pos1.col] = { ...newBoard[pos2.row][pos2.col] }
  newBoard[pos2.row][pos2.col] = temp
  return newBoard
}

export const findAllMatches = (board: Cell[][]): MatchGroup[] => {
  const matches: MatchGroup[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    let col = 0
    while (col < BOARD_SIZE) {
      const cell = board[row][col]
      if (!cell.color || cell.isObstacle) {
        col++
        continue
      }

      let endCol = col + 1
      while (
        endCol < BOARD_SIZE &&
        board[row][endCol].color === cell.color &&
        !board[row][endCol].isObstacle
      ) {
        endCol++
      }

      const length = endCol - col
      if (length >= 3) {
        const positions: Position[] = []
        for (let c = col; c < endCol; c++) {
          positions.push({ row, col: c })
        }
        matches.push({
          positions,
          length,
          direction: 'horizontal',
        })
      }
      col = endCol
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let row = 0
    while (row < BOARD_SIZE) {
      const cell = board[row][col]
      if (!cell.color || cell.isObstacle) {
        row++
        continue
      }

      let endRow = row + 1
      while (
        endRow < BOARD_SIZE &&
        board[endRow][col].color === cell.color &&
        !board[endRow][col].isObstacle
      ) {
        endRow++
      }

      const length = endRow - row
      if (length >= 3) {
        const positions: Position[] = []
        for (let r = row; r < endRow; r++) {
          positions.push({ row: r, col })
        }
        matches.push({
          positions,
          length,
          direction: 'vertical',
        })
      }
      row = endRow
    }
  }

  return matches
}

export interface MatchResult {
  positions: Position[]
  specialToCreate: { pos: Position; special: SpecialType }[]
}

export const getMatchResult = (board: Cell[][], matches: MatchGroup[]): MatchResult => {
  const allPositions = new Set<string>()
  const specialToCreate: { pos: Position; special: SpecialType }[] = []

  const horizontalMatches: MatchGroup[] = []
  const verticalMatches: MatchGroup[] = []

  matches.forEach((match) => {
    if (match.direction === 'horizontal') {
      horizontalMatches.push(match)
    } else {
      verticalMatches.push(match)
    }
  })

  const intersectionMap = new Map<string, { hMatch: MatchGroup; vMatch: MatchGroup }>()

  horizontalMatches.forEach((hMatch) => {
    verticalMatches.forEach((vMatch) => {
      const hSet = new Set(hMatch.positions.map((p) => `${p.row},${p.col}`))
      const vSet = new Set(vMatch.positions.map((p) => `${p.row},${p.col}`))

      const intersection = [...hSet].filter((x) => vSet.has(x))
      if (intersection.length > 0) {
        intersection.forEach((key) => {
          const [row, col] = key.split(',').map(Number)
          intersectionMap.set(key, { hMatch, vMatch })
        })
      }
    })
  })

  if (intersectionMap.size > 0) {
    let bestPos: Position | null = null
    let bestHMatch: MatchGroup | null = null
    let bestVMatch: MatchGroup | null = null
    let maxTotalLength = 0

    for (const [key, value] of intersectionMap) {
      const [row, col] = key.split(',').map(Number)
      const totalLength = value.hMatch.length + value.vMatch.length - 1
      if (totalLength > maxTotalLength || bestPos === null) {
        maxTotalLength = totalLength
        bestPos = { row, col }
        bestHMatch = value.hMatch
        bestVMatch = value.vMatch
      }
    }

    if (bestPos && bestHMatch && bestVMatch) {
      const hLen = bestHMatch.length
      const vLen = bestVMatch.length

      if (hLen >= 5 || vLen >= 5 || (hLen >= 4 && vLen >= 4)) {
        specialToCreate.push({ pos: bestPos, special: 'bomb' })
      } else if (hLen === 4 && vLen === 3) {
        specialToCreate.push({ pos: bestPos, special: 'rowClear' })
      } else if (hLen === 3 && vLen === 4) {
        specialToCreate.push({ pos: bestPos, special: 'colClear' })
      } else {
        specialToCreate.push({ pos: bestPos, special: 'bomb' })
      }
    }
  }

  matches.forEach((match) => {
    const isPartOfIntersection = match.positions.some((p) =>
      intersectionMap.has(`${p.row},${p.col}`)
    )

    if (isPartOfIntersection) return

    match.positions.forEach((pos) => {
      allPositions.add(`${pos.row},${pos.col}`)
    })

    const midIndex = Math.floor(match.length / 2)
    const midPos = match.positions[midIndex]

    if (match.length >= 5) {
      specialToCreate.push({ pos: midPos, special: 'bomb' })
    } else if (match.length === 4) {
      if (match.direction === 'horizontal') {
        specialToCreate.push({ pos: midPos, special: 'rowClear' })
      } else {
        specialToCreate.push({ pos: midPos, special: 'colClear' })
      }
    }
  })

  if (intersectionMap.size > 0) {
    matches.forEach((match) => {
      const isPartOfIntersection = match.positions.some((p) =>
        intersectionMap.has(`${p.row},${p.col}`)
      )
      if (isPartOfIntersection) {
        match.positions.forEach((pos) => {
          allPositions.add(`${pos.row},${pos.col}`)
        })
      }
    })
  }

  const positions: Position[] = []
  allPositions.forEach((key) => {
    const [row, col] = key.split(',').map(Number)
    positions.push({ row, col })
  })

  return { positions, specialToCreate }
}

export const applySpecialBubbleEffect = (
  board: Cell[][],
  pos: Position,
  specialType: SpecialType
): Position[] => {
  const affectedPositions: Position[] = []
  const cell = board[pos.row][pos.col]

  if (!cell.color && !cell.special) return affectedPositions

  if (specialType === 'rowClear') {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[pos.row][col].isObstacle) {
        affectedPositions.push({ row: pos.row, col })
      }
    }
  } else if (specialType === 'colClear') {
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (!board[row][pos.col].isObstacle) {
        affectedPositions.push({ row, col: pos.col })
      }
    }
  } else if (specialType === 'bomb') {
    for (let r = pos.row - 2; r <= pos.row + 2; r++) {
      for (let c = pos.col - 2; c <= pos.col + 2; c++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (!board[r][c].isObstacle) {
            affectedPositions.push({ row: r, col: c })
          }
        }
      }
    }
  }

  return affectedPositions
}

export const combineSpecials = (
  board: Cell[][],
  pos1: Position,
  pos2: Position
): { affectedPositions: Position[]; isCrossBomb: boolean } => {
  const cell1 = board[pos1.row][pos1.col]
  const cell2 = board[pos2.row][pos2.col]
  const affectedPositions: Position[] = []

  const special1 = cell1.special
  const special2 = cell2.special

  if (!special1 || !special2) return { affectedPositions: [], isCrossBomb: false }

  const hasRowClear = special1 === 'rowClear' || special2 === 'rowClear'
  const hasColClear = special1 === 'colClear' || special2 === 'colClear'
  const hasBomb = special1 === 'bomb' || special2 === 'bomb'

  if ((special1 === 'rowClear' && special2 === 'colClear') ||
      (special1 === 'colClear' && special2 === 'rowClear')) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[pos1.row][col].isObstacle) {
        affectedPositions.push({ row: pos1.row, col })
      }
    }
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (!board[row][pos1.col].isObstacle) {
        affectedPositions.push({ row, col: pos1.col })
      }
    }
    return { affectedPositions, isCrossBomb: true }
  }

  if (hasRowClear && hasBomb) {
    const midRow = pos1.row
    for (let r = midRow - 1; r <= midRow + 1; r++) {
      if (r >= 0 && r < BOARD_SIZE) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!board[r][c].isObstacle) {
            affectedPositions.push({ row: r, col: c })
          }
        }
      }
    }
    return { affectedPositions, isCrossBomb: true }
  }

  if (hasColClear && hasBomb) {
    const midCol = pos1.col
    for (let c = midCol - 1; c <= midCol + 1; c++) {
      if (c >= 0 && c < BOARD_SIZE) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (!board[r][c].isObstacle) {
            affectedPositions.push({ row: r, col: c })
          }
        }
      }
    }
    return { affectedPositions, isCrossBomb: true }
  }

  if (special1 === 'bomb' && special2 === 'bomb') {
    for (let r = pos1.row - 3; r <= pos1.row + 3; r++) {
      for (let c = pos1.col - 3; c <= pos1.col + 3; c++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (!board[r][c].isObstacle) {
            affectedPositions.push({ row: r, col: c })
          }
        }
      }
    }
    return { affectedPositions, isCrossBomb: true }
  }

  if (special1 === 'rowClear' && special2 === 'rowClear') {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[pos1.row][col].isObstacle) {
        affectedPositions.push({ row: pos1.row, col })
      }
      if (!board[pos2.row][col].isObstacle) {
        affectedPositions.push({ row: pos2.row, col })
      }
    }
    return { affectedPositions, isCrossBomb: false }
  }

  if (special1 === 'colClear' && special2 === 'colClear') {
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (!board[row][pos1.col].isObstacle) {
        affectedPositions.push({ row, col: pos1.col })
      }
      if (!board[row][pos2.col].isObstacle) {
        affectedPositions.push({ row, col: pos2.col })
      }
    }
    return { affectedPositions, isCrossBomb: false }
  }

  return { affectedPositions, isCrossBomb: false }
}

export const removeCells = (board: Cell[][], positions: Position[]): Cell[][] => {
  const newBoard = cloneBoard(board)
  positions.forEach((pos) => {
    if (!newBoard[pos.row][pos.col].isObstacle) {
      newBoard[pos.row][pos.col].color = null
      newBoard[pos.row][pos.col].special = null
    }
  })
  return newBoard
}

export const applyGravity = (board: Cell[][]): { board: Cell[][]; drops: { from: Position; to: Position }[] } => {
  const newBoard = cloneBoard(board)
  const drops: { from: Position; to: Position }[] = []

  for (let col = 0; col < BOARD_SIZE; col++) {
    let writeRow = BOARD_SIZE - 1

    for (let readRow = BOARD_SIZE - 1; readRow >= 0; readRow--) {
      if (newBoard[readRow][col].isObstacle) {
        writeRow = readRow - 1
        continue
      }

      if (newBoard[readRow][col].color !== null) {
        if (readRow !== writeRow) {
          newBoard[writeRow][col] = { ...newBoard[readRow][col] }
          newBoard[readRow][col] = { color: null, special: null, isObstacle: false }
          drops.push({ from: { row: readRow, col }, to: { row: writeRow, col } })
        }
        writeRow--
      }
    }
  }

  return { board: newBoard, drops }
}

export const fillBoard = (board: Cell[][], colors: BubbleColor[]): { board: Cell[][]; newCells: Position[] } => {
  const newBoard = cloneBoard(board)
  const newCells: Position[] = []

  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (newBoard[row][col].isObstacle) continue

      if (newBoard[row][col].color === null) {
        newBoard[row][col].color = getRandomColor(colors)
        newCells.push({ row, col })
      }
    }
  }

  return { board: newBoard, newCells }
}

export const hasValidMoves = (board: Cell[][]): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].isObstacle || !board[row][col].color) continue

      if (col < BOARD_SIZE - 1 && !board[row][col + 1].isObstacle) {
        const swapped = swapCells(board, { row, col }, { row, col: col + 1 })
        const matches = findAllMatches(swapped)
        if (matches.length > 0) return true
      }

      if (row < BOARD_SIZE - 1 && !board[row + 1][col].isObstacle) {
        const swapped = swapCells(board, { row, col }, { row: row + 1, col })
        const matches = findAllMatches(swapped)
        if (matches.length > 0) return true
      }
    }
  }
  return false
}

export const shuffleBoard = (board: Cell[][], colors: BubbleColor[]): Cell[][] => {
  let newBoard = cloneBoard(board)
  const nonObstaclePositions: Position[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!newBoard[row][col].isObstacle) {
        nonObstaclePositions.push({ row, col })
      }
    }
  }

  let attempts = 0
  do {
    const allCells: { color: BubbleColor; special: SpecialType | null }[] = []
    nonObstaclePositions.forEach((pos) => {
      const cell = newBoard[pos.row][pos.col]
      if (cell.color) {
        allCells.push({ color: cell.color, special: cell.special })
      }
    })

    for (let i = allCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allCells[i], allCells[j]] = [allCells[j], allCells[i]]
    }

    let cellIndex = 0
    nonObstaclePositions.forEach((pos) => {
      if (cellIndex < allCells.length) {
        newBoard[pos.row][pos.col].color = allCells[cellIndex].color
        newBoard[pos.row][pos.col].special = allCells[cellIndex].special
        cellIndex++
      }
    })

    attempts++
  } while ((!hasValidMoves(newBoard) || findAllMatches(newBoard).length > 0) && attempts < 100)

  return newBoard
}

export const updateTargets = (
  targets: Target[],
  eliminatedColors: Map<BubbleColor, number>,
  specialCollected: number
): Target[] => {
  return targets.map((target) => {
    if (target.type === 'eliminate' && target.color) {
      const count = eliminatedColors.get(target.color) || 0
      return {
        ...target,
        current: Math.min(target.count, target.current + count),
      }
    } else if (target.type === 'collectSpecial') {
      return {
        ...target,
        current: Math.min(target.count, target.current + specialCollected),
      }
    }
    return target
  })
}

export const checkWin = (targets: Target[]): boolean => {
  return targets.every((t) => t.current >= t.count)
}

export const getStars = (movesLeft: number, invalidSwaps: number, won: boolean): 0 | 1 | 2 | 3 => {
  if (!won) return 0
  if (movesLeft >= 10 && invalidSwaps === 0) return 3
  if (movesLeft >= 5) return 2
  return 1
}

export const ultimateClearColor = (board: Cell[][], color: BubbleColor): { board: Cell[][]; positions: Position[] } => {
  const newBoard = cloneBoard(board)
  const positions: Position[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (newBoard[row][col].color === color && !newBoard[row][col].isObstacle) {
        newBoard[row][col].color = null
        newBoard[row][col].special = null
        positions.push({ row, col })
      }
    }
  }

  return { board: newBoard, positions }
}

export const getMostCommonColor = (board: Cell[][]): BubbleColor | null => {
  const colorCount = new Map<BubbleColor, number>()

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const color = board[row][col].color
      if (color) {
        colorCount.set(color, (colorCount.get(color) || 0) + 1)
      }
    }
  }

  let maxColor: BubbleColor | null = null
  let maxCount = 0

  colorCount.forEach((count, color) => {
    if (count > maxCount) {
      maxCount = count
      maxColor = color
    }
  })

  return maxColor
}
