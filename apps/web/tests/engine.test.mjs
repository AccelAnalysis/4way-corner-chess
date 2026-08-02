import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMove,
  applyResignation,
  applyTimeout,
  boardIndex,
  createGameState,
  getClockSnapshot,
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
