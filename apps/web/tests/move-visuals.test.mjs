import test from 'node:test';
import assert from 'node:assert/strict';
import { MOVE_DURATION_MS, pieceTransform, lastMoveVisual } from '../src/experience/move-visuals.mjs';

test('piece transitions are quick enough to make moves clear without slowing play', () => {
  assert.ok(MOVE_DURATION_MS >= 150 && MOVE_DURATION_MS <= 300);
});

test('piece positions are square-relative so online boards scale without hard-coded pixels', () => {
  assert.equal(pieceTransform(0), 'translate3d(0%, 0%, 0)');
  assert.equal(pieceTransform(7), 'translate3d(700%, 0%, 0)');
  assert.equal(pieceTransform(8), 'translate3d(0%, 100%, 0)');
  assert.equal(pieceTransform(63), 'translate3d(700%, 700%, 0)');
  assert.equal(pieceTransform(26), 'translate3d(200%, 300%, 0)');
});

test('out of range squares are rejected before formatting a CSS transform', () => {
  for (const index of [-1, 64, 12.5, NaN, null, '4']) {
    assert.throws(() => pieceTransform(index), RangeError);
  }
});

test('a legal move points at the moving piece in the completed authoritative board', () => {
  const board = Array(64).fill(null);
  board[35] = { type: 'r', color: 'W', id: 'W-r1' };
  assert.deepEqual(lastMoveVisual({ from: 19, to: 35, captured: null }, board),
    { from: 19, to: 35, pieceId: 'W-r1', captured: false });
});

test('captures share the same stable piece identity and retain their origin highlight', () => {
  const board = Array(64).fill(null);
  board[63] = { type: 'q', color: 'R', id: 'W-q' };
  assert.deepEqual(lastMoveVisual({ from: 31, to: 63, captured: { type: 'p', color: 'R' } }, board),
    { from: 31, to: 63, pieceId: 'W-q', captured: true });
});

test('resign, timeout, initial state, malformed move, and stale destination have no move highlight', () => {
  const board = Array(64).fill(null);
  assert.equal(lastMoveVisual(null, board), null);
  assert.equal(lastMoveVisual({ type: 'timeout', seat: 'W' }, board), null);
  assert.equal(lastMoveVisual({ from: 0, to: 0 }, board), null);
  assert.equal(lastMoveVisual({ from: -1, to: 3 }, board), null);
  assert.equal(lastMoveVisual({ from: 0, to: 100 }, board), null);
  assert.equal(lastMoveVisual({ from: 0, to: 4 }, board), null);
  assert.equal(lastMoveVisual({ from: 0, to: 4 }, []), null);
});
