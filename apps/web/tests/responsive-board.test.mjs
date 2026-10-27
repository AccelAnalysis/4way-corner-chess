import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = name => readFileSync(new URL(name, import.meta.url), 'utf8');

test('local game board and pieces scale with viewport instead of fixed pixel squares', () => {
  const board = file('../src/components/KaniGame.part05.jsxpart');
  const controls = file('../src/components/KaniGame.part04.jsxpart');
  assert.doesNotMatch(board, /width: '480px'|height: '480px'|w-\[60px\]|h-\[60px\]/);
  assert.match(board, /h-\[12\.5%\] w-\[12\.5%\]/);
  assert.match(board, /pieceTransform\(effect\.r \* BOARD_SIZE/);
  assert.match(controls, /w-full min-w-0/);
  assert.match(controls, /max-w-\[510px\]/);
});

test('smaller screens constrain chess piece art and promotion buttons', () => {
  const css = file('../app/globals.css');
  assert.match(css, /kani-responsive-piece svg/);
  const controls = file('../src/components/KaniGame.part04.jsxpart');
  assert.match(controls, /sm:h-20 sm:w-20/);
});
