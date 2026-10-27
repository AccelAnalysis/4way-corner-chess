export const BOARD_SIZE = 8;
export const COLORS = ['W', 'B', 'K', 'R'];
export const COLOR_NAMES = {
  W: 'White',
  B: 'Blue',
  K: 'Black',
  R: 'Red',
};

const PIECES = [
  [0, 0, 'k', 'B', 'B-k'], [0, 1, 'b', 'B', 'B-b1'], [1, 0, 'b', 'B', 'B-b2'],
  [0, 2, 'r', 'B', 'B-r1'], [1, 1, 'q', 'B', 'B-q'], [2, 0, 'r', 'B', 'B-r2'],
  [0, 3, 'n', 'B', 'B-n1'], [1, 2, 'p', 'B', 'B-p1'], [2, 1, 'p', 'B', 'B-p2'], [3, 0, 'n', 'B', 'B-n2'],

  [0, 7, 'k', 'W', 'W-k'], [0, 6, 'b', 'W', 'W-b1'], [1, 7, 'b', 'W', 'W-b2'],
  [0, 5, 'r', 'W', 'W-r1'], [1, 6, 'q', 'W', 'W-q'], [2, 7, 'r', 'W', 'W-r2'],
  [0, 4, 'n', 'W', 'W-n1'], [1, 5, 'p', 'W', 'W-p1'], [2, 6, 'p', 'W', 'W-p2'], [3, 7, 'n', 'W', 'W-n2'],

  [7, 0, 'k', 'K', 'K-k'], [7, 1, 'b', 'K', 'K-b1'], [6, 0, 'b', 'K', 'K-b2'],
  [7, 2, 'r', 'K', 'K-r1'], [6, 1, 'q', 'K', 'K-q'], [5, 0, 'r', 'K', 'K-r2'],
  [7, 3, 'n', 'K', 'K-n1'], [6, 2, 'p', 'K', 'K-p1'], [5, 1, 'p', 'K', 'K-p2'], [4, 0, 'n', 'K', 'K-n2'],

  [7, 7, 'k', 'R', 'R-k'], [7, 6, 'b', 'R', 'R-b1'], [6, 7, 'b', 'R', 'R-b2'],
  [7, 5, 'r', 'R', 'R-r1'], [6, 6, 'q', 'R', 'R-q'], [5, 7, 'r', 'R', 'R-r2'],
  [7, 4, 'n', 'R', 'R-n1'], [6, 5, 'p', 'R', 'R-p1'], [5, 6, 'p', 'R', 'R-p2'], [4, 7, 'n', 'R', 'R-n2'],
];

const ORTHOGONAL = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KING_STEPS = [...ORTHOGONAL, ...DIAGONAL];
const KNIGHT_STEPS = [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]];
const PROMOTION_TYPES = new Set(['q', 'r', 'b', 'n']);
const PIECE_VALUES = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 10000 };

export class GameRuleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GameRuleError';
    this.code = code;
  }
}

export function boardIndex(row, column) {
  return row * BOARD_SIZE + column;
}

export function boardPosition(index) {
  return {
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
  };
}

function isInside(row, column) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}

function cloneControlled(controlled) {
  return Object.fromEntries(COLORS.map((color) => [color, [...(controlled[color] || [])]]));
}

function cloneBoard(board) {
  return board.map((piece) => (piece ? { ...piece, dir: piece.dir ? [...piece.dir] : null } : null));
}

export function isAllied(colorA, colorB, allianceMode = 'ffa') {
  if (colorA === colorB) return true;
  if (allianceMode === 'diagonals') {
    return (
      (['B', 'R'].includes(colorA) && ['B', 'R'].includes(colorB)) ||
      (['W', 'K'].includes(colorA) && ['W', 'K'].includes(colorB))
    );
  }
  if (allianceMode === 'top_bottom') {
    return (
      (['B', 'W'].includes(colorA) && ['B', 'W'].includes(colorB)) ||
      (['K', 'R'].includes(colorA) && ['K', 'R'].includes(colorB))
    );
  }
  return false;
}

export function createInitialBoard({ centerPawns = false } = {}) {
  const board = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
  for (const [row, column, type, color, id] of PIECES) {
    board[boardIndex(row, column)] = { type, color, id, dir: null };
  }

  if (centerPawns) {
    board[boardIndex(3, 3)] = { type: 'p', color: 'B', id: 'B-cp', dir: null };
    board[boardIndex(3, 4)] = { type: 'p', color: 'W', id: 'W-cp', dir: null };
    board[boardIndex(4, 3)] = { type: 'p', color: 'K', id: 'K-cp', dir: null };
    board[boardIndex(4, 4)] = { type: 'p', color: 'R', id: 'R-cp', dir: null };
  }

  return board;
}

export function createGameState({ mode = 'ffa', timeControlSeconds = 300, centerPawns = false } = {}, nowMs = Date.now()) {
  const normalizedMode = ['ffa', 'teams', 'blitz'].includes(mode) ? mode : 'ffa';
  const allianceMode = normalizedMode === 'teams' ? 'diagonals' : 'ffa';
  const normalizedTime = timeControlSeconds === null
    ? null
    : Math.max(15, Math.min(3600, Number(timeControlSeconds) || (normalizedMode === 'blitz' ? 60 : 300)));

  return {
    schemaVersion: 1,
    board: createInitialBoard({ centerPawns }),
    controlled: { W: ['W'], B: ['B'], K: ['K'], R: ['R'] },
    turnIndex: 0,
    turnCount: 0,
    version: 0,
    winner: null,
    status: 'active',
    mode: normalizedMode,
    allianceMode,
    centerPawns: Boolean(centerPawns),
    timeControlSeconds: normalizedTime,
    timeRemaining: {
      W: normalizedTime,
      B: normalizedTime,
      K: normalizedTime,
      R: normalizedTime,
    },
    turnStartedAtMs: nowMs,
    lastMove: null,
  };
}

function addStepMove(state, moves, sourceColor, row, column) {
  if (!isInside(row, column)) return false;
  const target = state.board[boardIndex(row, column)];
  if (!target || !isAllied(sourceColor, target.color, state.allianceMode)) {
    moves.push(boardIndex(row, column));
    return !target;
  }
  return false;
}

function addSlidingMoves(state, moves, sourceColor, row, column, directions) {
  for (const [rowDelta, columnDelta] of directions) {
    for (let distance = 1; distance < BOARD_SIZE; distance += 1) {
      if (!addStepMove(
        state,
        moves,
        sourceColor,
        row + rowDelta * distance,
        column + columnDelta * distance,
      )) break;
    }
  }
}

export function getValidMoveIndices(state, fromIndex) {
  if (!state || !Array.isArray(state.board) || state.board.length !== 64) return [];
  const piece = state.board[fromIndex];
  if (!piece) return [];
  const { row, column } = boardPosition(fromIndex);
  const moves = [];

  if (piece.type === 'n') {
    for (const [rowDelta, columnDelta] of KNIGHT_STEPS) {
      addStepMove(state, moves, piece.color, row + rowDelta, column + columnDelta);
    }
  } else if (piece.type === 'k') {
    for (const [rowDelta, columnDelta] of KING_STEPS) {
      addStepMove(state, moves, piece.color, row + rowDelta, column + columnDelta);
    }
  } else if (piece.type === 'r') {
    addSlidingMoves(state, moves, piece.color, row, column, ORTHOGONAL);
  } else if (piece.type === 'b') {
    addSlidingMoves(state, moves, piece.color, row, column, DIAGONAL);
  } else if (piece.type === 'q') {
    addSlidingMoves(state, moves, piece.color, row, column, KING_STEPS);
  } else if (piece.type === 'p') {
    if (piece.dir) {
      addStepMove(state, moves, piece.color, row + piece.dir[0], column + piece.dir[1]);
    } else {
      for (const [rowDelta, columnDelta] of KING_STEPS) {
        addStepMove(state, moves, piece.color, row + rowDelta, column + columnDelta);
      }
    }
  }

  return moves;
}

function remainingSecondsForCurrentTurn(state, nowMs) {
  if (state.timeControlSeconds === null) return null;
  const seat = COLORS[state.turnIndex];
  const elapsed = Math.max(0, Math.floor((nowMs - Number(state.turnStartedAtMs || nowMs)) / 1000));
  return Math.max(0, Number(state.timeRemaining?.[seat] ?? state.timeControlSeconds) - elapsed);
}

export function getClockSnapshot(state, nowMs = Date.now()) {
  const snapshot = { ...state.timeRemaining };
  if (state.status !== 'active' || state.timeControlSeconds === null) return snapshot;
  snapshot[COLORS[state.turnIndex]] = remainingSecondsForCurrentTurn(state, nowMs);
  return snapshot;
}

function nextLivingTurnIndex(controlled, currentIndex) {
  for (let step = 1; step <= COLORS.length; step += 1) {
    const candidate = (currentIndex + step) % COLORS.length;
    if ((controlled[COLORS[candidate]] || []).length > 0) return candidate;
  }
  return currentIndex;
}

function determineWinner(controlled, allianceMode) {
  const activeColors = COLORS.filter((color) => (controlled[color] || []).length > 0);
  if (activeColors.length === 0) return 'Draw';
  if (activeColors.length === 1) return activeColors[0];
  if (allianceMode === 'ffa') return null;

  const first = activeColors[0];
  if (!activeColors.every((color) => isAllied(first, color, allianceMode))) return null;

  if (allianceMode === 'diagonals') {
    return ['B', 'R'].includes(first) ? 'Blue & Red Alliance' : 'White & Black Alliance';
  }
  return ['B', 'W'].includes(first) ? 'Blue & White Alliance' : 'Black & Red Alliance';
}

function isPromotionSquare(piece, toIndex) {
  if (piece.type !== 'p') return false;
  const { row, column } = boardPosition(toIndex);
  if (piece.color === 'B') return row === 7 || column === 7;
  if (piece.color === 'W') return row === 7 || column === 0;
  if (piece.color === 'K') return row === 0 || column === 7;
  return row === 0 || column === 0;
}

function finalizeTurn(state, controlled, nowMs) {
  const winner = determineWinner(controlled, state.allianceMode);
  if (winner) {
    return {
      winner,
      status: 'complete',
      turnIndex: state.turnIndex,
      turnStartedAtMs: nowMs,
    };
  }
  return {
    winner: null,
    status: 'active',
    turnIndex: nextLivingTurnIndex(controlled, state.turnIndex),
    turnStartedAtMs: nowMs,
  };
}

export function applyMove(state, { seat, from, to, promotion = 'q' }, nowMs = Date.now()) {
  if (!state || state.status !== 'active' || state.winner) {
    throw new GameRuleError('MATCH_NOT_ACTIVE', 'The match is not active.');
  }
  const currentSeat = COLORS[state.turnIndex];
  if (seat !== currentSeat) {
    throw new GameRuleError('NOT_YOUR_TURN', `It is ${COLOR_NAMES[currentSeat]}'s turn.`);
  }
  if (!Number.isInteger(from) || from < 0 || from >= 64 || !Number.isInteger(to) || to < 0 || to >= 64) {
    throw new GameRuleError('INVALID_COORDINATES', 'Move coordinates are outside the board.');
  }
  if (remainingSecondsForCurrentTurn(state, nowMs) === 0) {
    throw new GameRuleError('TIME_EXPIRED', 'The active player clock has expired.');
  }

  const sourcePiece = state.board[from];
  if (!sourcePiece || !(state.controlled[seat] || []).includes(sourcePiece.color)) {
    throw new GameRuleError('PIECE_NOT_CONTROLLED', 'That piece is not controlled by the active seat.');
  }
  const validMoves = getValidMoveIndices(state, from);
  if (!validMoves.includes(to)) {
    throw new GameRuleError('ILLEGAL_MOVE', 'That move is not legal in the current position.');
  }

  const board = cloneBoard(state.board);
  const controlled = cloneControlled(state.controlled);
  const movingPiece = { ...board[from], dir: board[from].dir ? [...board[from].dir] : null };
  const capturedPiece = board[to] ? { ...board[to] } : null;

  if (movingPiece.type === 'p' && !movingPiece.dir) {
    const fromPosition = boardPosition(from);
    const toPosition = boardPosition(to);
    movingPiece.dir = [toPosition.row - fromPosition.row, toPosition.column - fromPosition.column];
  }

  if (capturedPiece?.type === 'k') {
    const defeatedColor = capturedPiece.color;
    controlled[seat] = [...new Set([...(controlled[seat] || []), ...(controlled[defeatedColor] || [])])];
    controlled[defeatedColor] = [];
    for (let index = 0; index < board.length; index += 1) {
      if (board[index]?.color === defeatedColor) board[index] = { ...board[index], color: seat };
    }
    movingPiece.color = seat;
  }

  let promotedTo = null;
  if (isPromotionSquare(movingPiece, to)) {
    promotedTo = PROMOTION_TYPES.has(promotion) ? promotion : 'q';
    movingPiece.type = promotedTo;
  }

  board[from] = null;
  board[to] = movingPiece;

  const timeRemaining = getClockSnapshot(state, nowMs);
  const finalized = finalizeTurn(state, controlled, nowMs);

  return {
    ...state,
    ...finalized,
    board,
    controlled,
    timeRemaining,
    turnCount: Number(state.turnCount || 0) + 1,
    version: Number(state.version || 0) + 1,
    lastMove: {
      seat,
      from,
      to,
      captured: capturedPiece ? { type: capturedPiece.type, color: capturedPiece.color } : null,
      promotedTo,
      atMs: nowMs,
    },
  };
}

function removeSeatArmy(board, controlledColors) {
  const eliminated = new Set(controlledColors || []);
  return cloneBoard(board).map((piece) => (piece && eliminated.has(piece.color) ? null : piece));
}

export function applyResignation(state, seat, nowMs = Date.now()) {
  if (state.status !== 'active') throw new GameRuleError('MATCH_NOT_ACTIVE', 'The match is not active.');
  if (!COLORS.includes(seat)) throw new GameRuleError('INVALID_SEAT', 'Unknown player seat.');

  const controlled = cloneControlled(state.controlled);
  const board = removeSeatArmy(state.board, controlled[seat]);
  controlled[seat] = [];
  const finalized = finalizeTurn(state, controlled, nowMs);
  if (!finalized.winner && COLORS[state.turnIndex] === seat) {
    finalized.turnIndex = nextLivingTurnIndex(controlled, state.turnIndex);
  }

  return {
    ...state,
    ...finalized,
    board,
    controlled,
    timeRemaining: getClockSnapshot(state, nowMs),
    version: Number(state.version || 0) + 1,
    lastMove: { type: 'resign', seat, atMs: nowMs },
  };
}

export function applyTimeout(state, nowMs = Date.now()) {
  if (state.status !== 'active') throw new GameRuleError('MATCH_NOT_ACTIVE', 'The match is not active.');
  const seat = COLORS[state.turnIndex];
  if (remainingSecondsForCurrentTurn(state, nowMs) > 0) {
    throw new GameRuleError('CLOCK_RUNNING', 'The active clock has not expired.');
  }

  const controlled = cloneControlled(state.controlled);
  const board = removeSeatArmy(state.board, controlled[seat]);
  controlled[seat] = [];
  const timeRemaining = { ...state.timeRemaining, [seat]: 0 };
  const finalized = finalizeTurn(state, controlled, nowMs);
  if (!finalized.winner) finalized.turnIndex = nextLivingTurnIndex(controlled, state.turnIndex);

  return {
    ...state,
    ...finalized,
    board,
    controlled,
    timeRemaining,
    version: Number(state.version || 0) + 1,
    lastMove: { type: 'timeout', seat, atMs: nowMs },
  };
}

export function chooseAIMove(state, seat) {
  if (COLORS[state.turnIndex] !== seat) {
    throw new GameRuleError('NOT_YOUR_TURN', 'The AI seat is not active.');
  }
  const candidates = [];
  for (let from = 0; from < state.board.length; from += 1) {
    const piece = state.board[from];
    if (!piece || !(state.controlled[seat] || []).includes(piece.color)) continue;
    for (const to of getValidMoveIndices(state, from)) {
      const target = state.board[to];
      const { row, column } = boardPosition(to);
      let score = target ? PIECE_VALUES[target.type] : 0;
      score += 7 - (Math.abs(3.5 - row) + Math.abs(3.5 - column));
      score += Math.random() * 0.25;
      candidates.push({ from, to, promotion: 'q', score });
    }
  }
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0] || null;
}
