// Presentation-only helpers. Positions use square-relative percentages so the
// same animation works on desktop, phone, and tablet without measuring the DOM.
export const MOVE_DURATION_MS = 230;
const BOARD_SQUARES = 64;

export function pieceTransform(index) {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_SQUARES) {
    throw new RangeError('A chess piece position must be an index from 0 to 63.');
  }
  return `translate3d(${(index % 8) * 100}%, ${Math.floor(index / 8) * 100}%, 0)`;
}

export function lastMoveVisual(lastMove, board) {
  if (!lastMove || !Array.isArray(board) || board.length !== BOARD_SQUARES) return null;
  const { from, to } = lastMove;
  if (!Number.isInteger(from) || !Number.isInteger(to) ||
      from < 0 || from >= BOARD_SQUARES ||
      to < 0 || to >= BOARD_SQUARES || from === to) return null;
  const piece = board[to];
  if (!piece || !piece.id) return null;
  return { from, to, pieceId: piece.id, captured: Boolean(lastMove.captured) };
}
