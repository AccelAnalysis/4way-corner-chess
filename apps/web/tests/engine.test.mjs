import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMove,
  applyResignation,
  applyTimeout,
  boardIndex,
  createGameState,
  getClockSnapshot,
  positionSignature,
  getValidMoveIndices,
} from '../src/game/engine.mjs';

test('creates a flat Firestore-safe board', () => {
  const state = createGameState({}, 1000);
  assert.equal(state.board.length, 64);
  assert.equal(Array.isArray(state.board[0]), false);
  assert.equal(state.board[boardIndex(0, 7)].type, 'k');
});

test('server validates and applies a legal first pawn move', () => {
  const state = createGameState({}, 1000);
  const from = boardIndex(1, 5);
  const to = boardIndex(2, 4);
  assert.ok(getValidMoveIndices(state, from).includes(to));
  const next = applyMove(state, { seat: 'W', from, to }, 2000);
  assert.equal(next.board[to].type, 'p');
  assert.deepEqual(next.board[to].dir, [1, -1]);
  assert.equal(next.turnIndex, 1);
  assert.equal(next.version, 1);
});

test('rejects a move from the wrong seat', () => {
  const state = createGameState({}, 1000);
  assert.throws(
    () => applyMove(state, { seat: 'B', from: boardIndex(1, 2), to: boardIndex(2, 3) }, 1000),
    (error) => error.code === 'NOT_YOUR_TURN',
  );
});

test('clock snapshot deducts elapsed time', () => {
  const state = createGameState({ timeControlSeconds: 60 }, 1000);
  assert.equal(getClockSnapshot(state, 11000).W, 50);
});

test('timeout eliminates the active seat and removes its army', () => {
  const state = createGameState({ timeControlSeconds: 15 }, 1000);
  const next = applyTimeout(state, 17000);
  assert.deepEqual(next.controlled.W, []);
  assert.equal(next.board.some((piece) => piece?.color === 'W'), false);
  assert.equal(next.turnIndex, 1);
});

test('resignation removes the departing army and advances the turn', () => {
  const state = createGameState({}, 1000);
  const next = applyResignation(state, 'W', 2000);
  assert.deepEqual(next.controlled.W, []);
  assert.equal(next.board.some((piece) => piece?.color === 'W'), false);
  assert.equal(next.turnIndex, 1);
});

test('unlimited clocks cannot be falsely timed out (release-blocker regression)', () => {
  const state = createGameState({ timeControlSeconds: null }, 0);
  assert.throws(() => applyTimeout(state, 100000), (error) => error.code === 'CLOCK_DISABLED');
  assert.equal(state.controlled.W.length, 1);
  assert.equal(state.version, 0);
});

test('finite clocks do not expire early, and elapsed time works from timestamp zero', () => {
  const state = createGameState({ timeControlSeconds: 15 }, 0);
  assert.equal(getClockSnapshot(state, 5000).W, 10);
  assert.throws(() => applyTimeout(state, 14999), (error) => error.code === 'CLOCK_RUNNING');
  const expired = applyTimeout(state, 15000);
  assert.equal(expired.timeRemaining.W, 0);
  assert.equal(expired.turnIndex, 1);
});

test('off-turn resignation retains the active player and preserves the elapsed clock', () => {
  const state = createGameState({ timeControlSeconds: 30 }, 1000);
  const after = applyResignation(state, 'B', 11000);
  assert.equal(after.turnIndex, 0);
  assert.equal(after.timeRemaining.W, 20);
  assert.equal(after.turnStartedAtMs, 11000);
  assert.equal(getClockSnapshot(after, 16000).W, 15);
  assert.deepEqual(after.controlled.B, []);
  assert.throws(() => applyResignation(after, 'B', 16000), (error) => error.code === 'ALREADY_ELIMINATED');
});

test('active resignation advances to the next living seat without adding free turns', () => {
  const state = createGameState({}, 1000);
  const next = applyResignation(state, 'W', 2000);
  assert.equal(next.turnIndex, 1);
  assert.equal(next.status, 'active');
});

test('each pawn retains its original promotion goal after it changes controllers', () => {
  const original = createGameState({ timeControlSeconds: null }, 1000);
  const board = Array(64).fill(null);
  board[boardIndex(7, 7)] = { type: 'k', color: 'W', originColor: 'W', id: 'W-k', dir: null };
  board[boardIndex(0, 0)] = { type: 'k', color: 'B', originColor: 'B', id: 'B-k', dir: null };
  board[boardIndex(0, 4)] = { type: 'r', color: 'W', originColor: 'W', id: 'W-r', dir: null };
  board[boardIndex(3, 6)] = { type: 'p', color: 'B', originColor: 'B', id: 'B-p', dir: [0, 1] };
  board[boardIndex(7, 0)] = { type: 'k', color: 'K', originColor: 'K', id: 'K-k', dir: null };
  board[boardIndex(6, 7)] = { type: 'k', color: 'R', originColor: 'R', id: 'R-k', dir: null };
  const state = { ...original, board, turnIndex: 0, positionHistory: [] };
  const captured = applyMove(state, { seat: 'W', from: boardIndex(0, 4), to: boardIndex(0, 0) }, 1000);
  assert.equal(captured.board[boardIndex(3, 6)].color, 'W');
  assert.equal(captured.board[boardIndex(3, 6)].originColor, 'B');
  assert.deepEqual(captured.board[boardIndex(3, 6)].dir, [0, 1]);
  const whiteTurn = { ...captured, turnIndex: 0, status: 'active', winner: null, turnStartedAtMs: 1000, positionHistory: [] };
  const promoted = applyMove(whiteTurn, { seat: 'W', from: boardIndex(3, 6), to: boardIndex(3, 7), promotion: 'n' }, 1000);
  assert.equal(promoted.board[boardIndex(3, 7)].type, 'n');
  assert.equal(promoted.board[boardIndex(3, 7)].originColor, 'B');
});

test('identical positions resolve as a draw after the third occurrence', () => {
  const initial = createGameState({ timeControlSeconds: null }, 1000);
  const from = boardIndex(1, 5);
  const to = boardIndex(2, 4);
  const once = applyMove(initial, { seat: 'W', from, to }, 1000);
  const signature = positionSignature(once);
  const seeded = { ...initial, positionHistory: [positionSignature(initial), signature, signature] };
  const draw = applyMove(seeded, { seat: 'W', from, to }, 1000);
  assert.equal(draw.status, 'complete');
  assert.equal(draw.winner, 'Draw');
  assert.equal(draw.drawReason, 'threefold_repetition');
});

test('160 non-progress moves resolve in a draw', () => {
  const state = createGameState({ timeControlSeconds: null }, 1000);
  const noProgress = { ...state, noProgressPlies: 159 };
  const next = applyMove(noProgress, { seat: 'W', from: boardIndex(0, 4), to: boardIndex(2, 3) }, 1000);
  assert.equal(next.noProgressPlies, 160);
  assert.equal(next.winner, 'Draw');
  assert.equal(next.drawReason, 'no_progress');
});

test('a player with no legal moves is eliminated before their turn begins', () => {
  const initial = createGameState({ timeControlSeconds: null }, 1000);
  const board = Array(64).fill(null);
  board[boardIndex(7, 7)] = { type: 'k', color: 'W', originColor: 'W', dir: null };
  board[boardIndex(5, 5)] = { type: 'p', color: 'W', originColor: 'W', dir: [-1, 0] };
  board[boardIndex(0, 0)] = { type: 'k', color: 'B', originColor: 'B', dir: null };
  board[boardIndex(0, 1)] = { type: 'p', color: 'B', originColor: 'B', dir: [-1, 0] };
  board[boardIndex(1, 0)] = { type: 'p', color: 'B', originColor: 'B', dir: [0, -1] };
  board[boardIndex(1, 1)] = { type: 'p', color: 'B', originColor: 'B', dir: [-1, 0] };
  board[boardIndex(7, 0)] = { type: 'k', color: 'K', originColor: 'K', dir: null };
  board[boardIndex(5, 7)] = { type: 'k', color: 'R', originColor: 'R', dir: null };
  const state = { ...initial, board, positionHistory: [] };
  const next = applyMove(state, { seat: 'W', from: boardIndex(5, 5), to: boardIndex(4, 5) }, 1000);
  assert.deepEqual(next.controlled.B, []);
  assert.ok(next.lastMove.autoEliminated.includes('B'));
  assert.equal(next.turnIndex, 2);
});

test('the engine does not mutate the source board on move or resignation', () => {
  const state = createGameState({ timeControlSeconds: null }, 1000);
  const before = JSON.stringify(state);
  applyMove(state, { seat: 'W', from: boardIndex(1, 5), to: boardIndex(2, 4) }, 1000);
  applyResignation(state, 'B', 1000);
  assert.equal(JSON.stringify(state), before);
});
