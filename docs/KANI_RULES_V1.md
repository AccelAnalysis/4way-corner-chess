# KANI Core Rules v1.0 (web and online)

KANI is an 8×8, four-corner, four-army chess variant. These rules describe the **current browser/mobile target**, not the historical Python/Pygame prototype. The Python prototype originally used different pawn rules. It remains available for reference until the platform-wide rules engine migration is complete.

## Seats, turns, and winning

- Seat order is **White (top-right), Blue (top-left), Black (bottom-left), Red (bottom-right)**, repeating in that order from the starting White turn. This order is KANI's current code order; it is not traditional chess ordering.
- A player moves exactly one controlled piece on their turn. Pieces captured from defeated armies are treated as controlled by the conqueror.
- **A king can be captured directly.** There is no check or checkmate prohibition. Capturing a king eliminates that seat, and the conqueror gains the defeated seat's surviving pieces.
- **Conquest does not grant an additional turn.** The rotation skips defeated seats. This is the current web standard; the older README claim about inheriting another turn was stale.
- The last controlling seat wins a free-for-all. In Teams mode, the match ends when every surviving seat belongs to one alliance. Allies cannot capture one another.
- There is no castling, en passant, or standard chess double-square pawn opening.

## Pieces and promotion

- Kings move one square in any direction; queens, rooks, bishops, and knights move as in ordinary chess (except that no move is prohibited by 'check').
- Pawns can make a **first one-square move or capture in any of eight directions**. That first move sets their permanent direction. Subsequently, a pawn moves/captures one square in that locked direction, if legal. This is the established web ruleset and differs intentionally from the original Python prototype.
- Each pawn retains its **origin army color** after conquest. Its direction never resets, and its promotion destination is based on its **origin**, not the conquering seat.
- A pawn promotes on reaching either of the two far edges relative to its origin corner: Blue promotes on bottom/right, White on bottom/left, Black on top/right, Red on top/left.
- A promoting player can choose queen, rook, bishop, or knight. The default is queen if no choice is provided.

## Blocked turns, resignation, and time

- If the next living seat has **no legal move with any controlled piece**, that seat is eliminated, its army is removed, and the rotation continues. These eliminations can cascade; a match may end immediately. This follows the original desktop game's treatment of blocked players.
- Resignation is permitted even when it is not your turn, but it cannot **skip another player's active turn or replenish their remaining clock**. Repeating a resignation for an eliminated seat is invalid.
- With no clock, timeout claims are invalid. With clocks enabled, only a verified expired current-seat clock causes elimination. The server computes elapsed time; a client cannot define the authoritative time.
- Three occurrences of the **same complete position** (piece types, colors, original pawn color, locked directions, armies controlled, turn, alliance mode) end in a draw. Clock differences alone are not position differences.
- A match ends in a draw after **160 successive moves** without a capture or pawn move. Captures, pawn moves, and eliminations reset this counter. KANI stores a bounded position history for repetition checks.

## Development and fairness

- The canonical game-state schema for this ruleset is **2**. Keep the ruleset/version fixed for replays and multiplayer matches.
- The `apps/web/src/game/engine.mjs` module is authoritative for the secure online API; browsers are read-only for online room state.
- The local browser prototype contains its older UI rules implementation. Consolidating it to the canonical engine is a separate outstanding compatibility task; do **not** describe mode parity as fully verified before that migration.
- These gameplay decisions should be analyzed for long-run competitive balance before ranked release. Do not introduce pay-to-win advantages.
