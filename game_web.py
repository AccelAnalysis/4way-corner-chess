from enum import Enum
from typing import List, Dict, Tuple, Optional, Set, Any

class PieceType(Enum):
    KING = 0
    QUEEN = 1
    ROOK = 2
    BISHOP = 3
    KNIGHT = 4
    PAWN = 5

class Piece:
    def __init__(self, piece_type: PieceType, player: int, position: Tuple[int, int]):
        self.type = piece_type
        self.player = player
        self.position = position
        self.has_moved = False
        self.pawn_direction = None
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert piece to a dictionary for JSON serialization"""
        return {
            'type': self.type.value,
            'player': self.player,
            'position': self.position,
            'has_moved': self.has_moved
        }

class Game:
    def __init__(self):
        self.board = [[None for _ in range(8)] for _ in range(8)]
        self.players = [True] * 4
        self.current_player = 0
        self.pieces = []
        self.setup_board()
    
    def setup_board(self):
        # Player 0 (Black) - Top-left
        self.place_pieces(0, (0, 0), (1, 1))
        # Player 1 (Blue) - Top-right
        self.place_pieces(1, (0, 7), (1, -1))
        # Player 2 (Green) - Bottom-right
        self.place_pieces(2, (7, 7), (-1, -1))
        # Player 3 (Red) - Bottom-left
        self.place_pieces(3, (7, 0), (-1, 1))
    
    def place_pieces(self, player: int, corner: Tuple[int, int], direction: Tuple[int, int]):
        def get_pos(row_offset: int, col_offset: int) -> Tuple[int, int]:
            row = corner[0] + row_offset * direction[0]
            col = corner[1] + col_offset * direction[1]
            return (row, col)
        
        # Place King in the corner
        self.add_piece(PieceType.KING, player, corner)
        
        # Place Queen one square diagonally from King
        self.add_piece(PieceType.QUEEN, player, get_pos(1, 1))
        
        # Place Bishops
        self.add_piece(PieceType.BISHOP, player, get_pos(2, 0))
        self.add_piece(PieceType.BISHOP, player, get_pos(0, 2))
        
        # Place Knights
        self.add_piece(PieceType.KNIGHT, player, get_pos(1, 0))
        self.add_piece(PieceType.KNIGHT, player, get_pos(0, 1))
        
        # Place Pawns in a diagonal line, avoiding rook positions
        self.add_piece(PieceType.PAWN, player, get_pos(3, 0))
        self.add_piece(PieceType.PAWN, player, get_pos(0, 3))
        self.add_piece(PieceType.PAWN, player, get_pos(3, 3))
        
        # Place Rooks last (so they'll be on top of pawns)
        self.add_piece(PieceType.ROOK, player, get_pos(2, 1))
        self.add_piece(PieceType.ROOK, player, get_pos(1, 2))
    
    def add_piece(self, piece_type: PieceType, player: int, position: Tuple[int, int]):
        piece = Piece(piece_type, player, position)
        self.pieces.append(piece)
        self.board[position[0]][position[1]] = piece
    
    def get_piece(self, position: Tuple[int, int]) -> Optional[Piece]:
        if 0 <= position[0] < 8 and 0 <= position[1] < 8:
            return self.board[position[0]][position[1]]
        return None
    
    def get_valid_moves(self, piece: Piece) -> Set[Tuple[int, int]]:
        moves = set()
        row, col = piece.position
        
        # Simplified move logic for the web version
        # This is a placeholder - you'll need to implement the full move logic
        # based on the piece type and game rules
        if piece.type == PieceType.PAWN:
            # Pawn movement depends on whether it has moved and its locked direction
            if piece.pawn_direction is None:
                # First move: can move in any cardinal direction (up, down, left, right)
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    new_pos = (row + dr, col + dc)
                    if self.is_valid_position(new_pos) and not self.get_piece(new_pos):
                        moves.add(new_pos)
            else:
                # Subsequent moves: can only move in the locked direction
                dr, dc = piece.pawn_direction
                new_pos = (row + dr, col + dc)
                if self.is_valid_position(new_pos) and not self.get_piece(new_pos):
                    moves.add(new_pos)
                
                # Check for perpendicular captures (one square to either side of movement direction)
                if dr == 0:  # If moving horizontally, check vertical captures
                    for capture_dr in [-1, 1]:
                        capture_pos = (row + capture_dr, col + dc)
                        if self.is_valid_position(capture_pos):
                            target = self.get_piece(capture_pos)
                            if target is not None and target.player != piece.player:
                                moves.add(capture_pos)
                else:  # If moving vertically, check horizontal captures
                    for capture_dc in [-1, 1]:
                        capture_pos = (row + dr, col + capture_dc)
                        if self.is_valid_position(capture_pos):
                            target = self.get_piece(capture_pos)
                            if target is not None and target.player != piece.player:
                                moves.add(capture_pos)
        
        return moves
    
    def move_piece(self, piece: Piece, new_position: Tuple[int, int]):
        # Remove any piece at the target position
        target = self.get_piece(new_position)
        if target:
            self.pieces.remove(target)
            
        # Handle pawn direction locking
        if piece.type == PieceType.PAWN and piece.pawn_direction is None:
            dr = new_position[0] - piece.position[0]
            dc = new_position[1] - piece.position[1]
            piece.pawn_direction = (dr, dc)
            
        # Move the piece
        old_row, old_col = piece.position
        new_row, new_col = new_position
        self.board[old_row][old_col] = None
        piece.position = new_position
        self.board[new_row][new_col] = piece
        piece.has_moved = True
    
    def next_turn(self):
        self.current_player = (self.current_player + 1) % 4
        while not self.players[self.current_player]:
            self.current_player = (self.current_player + 1) % 4
    
    def check_win_condition(self) -> int:
        # Check if any player has no pieces left
        pieces_count = [0] * 4
        for piece in self.pieces:
            pieces_count[piece.player] += 1
        
        for i in range(4):
            if pieces_count[i] == 0 and self.players[i]:
                return (i - 1) % 4  # Previous player wins
                
        return -1  # No winner yet
    
    def is_valid_position(self, position: Tuple[int, int]) -> bool:
        return 0 <= position[0] < 8 and 0 <= position[1] < 8
    
    def get_board(self):
        # Return a flat list of pieces for easier access from JavaScript
        flat_board = [None] * 64
        for row in range(8):
            for col in range(8):
                piece = self.board[row][col]
                if piece:
                    flat_board[row * 8 + col] = piece
        return flat_board
