import pygame
import sys
import os
from enum import Enum
from typing import List, Dict, Tuple, Optional, Set, Callable
import random
import time

# Initialize pygame
pygame.init()
pygame.font.init()

# Constants
WINDOW_SIZE = 800
BOARD_SIZE = 8
SQUARE_SIZE = WINDOW_SIZE // BOARD_SIZE
PIECE_SIZE = SQUARE_SIZE - 20

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (0, 0, 255)
RED = (255, 0, 0)
GRAY = (200, 200, 200)
HIGHLIGHT = (128, 0, 128, 100)  # Purple highlight with transparency

# Player colors
GREEN = (0, 128, 0)  # Green color for Player 3
PLAYER_COLORS = [BLACK, BLUE, GREEN, RED]
PLAYER_HIGHLIGHTS = [
    (100, 100, 100),  # Dark gray for black player highlight
    (100, 100, 255),  # Light blue for blue player highlight
    (100, 255, 100),  # Light green for green player highlight
    (255, 100, 100)   # Light red for red player highlight
]

class PieceType(Enum):
    KING = "king"
    QUEEN = "queen"
    ROOK = "rook"
    BISHOP = "bishop"
    KNIGHT = "knight"
    PAWN = "pawn"

class Piece:
    def __init__(self, piece_type: PieceType, player: int, position: Tuple[int, int]):
        self.type = piece_type
        self.player = player
        self.position = position
        self.has_moved = False
        self.pawn_direction = None  # For pawn movement tracking
        
    def __str__(self):
        return f"{self.type.value.capitalize()} at {self.position} (Player {self.player + 1})"

class Game:
    def __init__(self):
        self.board = [[None for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
        self.players = [True] * 4  # Track active players
        self.current_player = 0
        self.pieces = []
        self.selected_piece = None
        self.valid_moves = set()
        self.winner = None
        self.setup_board()
    
    def setup_board(self):
        # Define starting positions for each player
        # Player 0 (Black) - Top-left
        self.place_pieces(0, (0, 0), (1, 1))
        # Player 1 (Blue) - Top-right
        self.place_pieces(1, (0, BOARD_SIZE-1), (1, -1))
        # Player 2 (White) - Bottom-right
        self.place_pieces(2, (BOARD_SIZE-1, BOARD_SIZE-1), (-1, -1))
        # Player 3 (Red) - Bottom-left
        self.place_pieces(3, (BOARD_SIZE-1, 0), (-1, 1))
        
        # Add center pawns for each player
        self.add_piece(PieceType.PAWN, 0, (3, 3))  # Black pawn
        self.add_piece(PieceType.PAWN, 1, (3, 4))  # Blue pawn
        self.add_piece(PieceType.PAWN, 2, (4, 4))  # Green pawn
        self.add_piece(PieceType.PAWN, 3, (4, 3))  # Red pawn
    
    def place_pieces(self, player: int, corner: Tuple[int, int], direction: Tuple[int, int]):
        # Calculate the relative positions based on the corner and direction
        def get_pos(row_offset: int, col_offset: int) -> Tuple[int, int]:
            # For player 0 (top-left): (0,0) is corner, direction is (1,1)
            # For player 1 (top-right): (0,7) is corner, direction is (1,-1)
            # For player 2 (bottom-right): (7,7) is corner, direction is (-1,-1)
            # For player 3 (bottom-left): (7,0) is corner, direction is (-1,1)
            row = corner[0] + row_offset * direction[0]
            col = corner[1] + col_offset * direction[1]
            return (row, col)
        
        # First, place all pieces except rooks and pawns
        self.add_piece(PieceType.KING, player, corner)  # King in the corner
        self.add_piece(PieceType.QUEEN, player, get_pos(1, 1))  # Queen one square diagonally from King
        
        # Place Bishops
        self.add_piece(PieceType.BISHOP, player, get_pos(2, 0))
        self.add_piece(PieceType.BISHOP, player, get_pos(0, 2))
        
        # Place Knights
        self.add_piece(PieceType.KNIGHT, player, get_pos(1, 0))
        self.add_piece(PieceType.KNIGHT, player, get_pos(0, 1))
        
        # Place Pawns in a diagonal line, avoiding rook positions
        self.add_piece(PieceType.PAWN, player, get_pos(3, 0))  # Below the bishop
        self.add_piece(PieceType.PAWN, player, get_pos(0, 3))  # To the right of the bishop
        self.add_piece(PieceType.PAWN, player, get_pos(3, 3))  # Further down the diagonal
        
        # Place Rooks
        self.add_piece(PieceType.ROOK, player, get_pos(2, 1))
        self.add_piece(PieceType.ROOK, player, get_pos(1, 2))
    
    def add_piece(self, piece_type: PieceType, player: int, position: Tuple[int, int]):
        piece = Piece(piece_type, player, position)
        self.pieces.append(piece)
        self.board[position[0]][position[1]] = piece
    
    def get_piece(self, position: Tuple[int, int]) -> Optional[Piece]:
        if 0 <= position[0] < BOARD_SIZE and 0 <= position[1] < BOARD_SIZE:
            return self.board[position[0]][position[1]]
        return None
    
    def is_valid_position(self, position: Tuple[int, int]) -> bool:
        return 0 <= position[0] < BOARD_SIZE and 0 <= position[1] < BOARD_SIZE
    
    def get_valid_moves(self, piece: Piece) -> Set[Tuple[int, int]]:
        moves = set()
        row, col = piece.position
        
        if piece.type == PieceType.KING:
            # King moves one square in any direction
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    if dr == 0 and dc == 0:
                        continue
                    new_pos = (row + dr, col + dc)
                    if self.is_valid_position(new_pos):
                        target = self.get_piece(new_pos)
                        if target is None or target.player != piece.player:
                            moves.add(new_pos)
            
        elif piece.type == PieceType.QUEEN:
            # Queen combines rook and bishop moves
            self.add_line_moves(piece, moves, [(1, 0), (-1, 0), (0, 1), (0, -1)])  # Rook
            self.add_line_moves(piece, moves, [(1, 1), (1, -1), (-1, 1), (-1, -1)])  # Bishop
            
        elif piece.type == PieceType.ROOK:
            # Rook moves orthogonally
            self.add_line_moves(piece, moves, [(1, 0), (-1, 0), (0, 1), (0, -1)])
            
        elif piece.type == PieceType.BISHOP:
            # Bishop moves diagonally
            self.add_line_moves(piece, moves, [(1, 1), (1, -1), (-1, 1), (-1, -1)])
            
        elif piece.type == PieceType.KNIGHT:
            # Knight moves in L-shape
            for dr, dc in [(2, 1), (2, -1), (-2, 1), (-2, -1), 
                          (1, 2), (1, -2), (-1, 2), (-1, -2)]:
                new_pos = (row + dr, col + dc)
                if self.is_valid_position(new_pos):
                    target = self.get_piece(new_pos)
                    if target is None or target.player != piece.player:
                        moves.add(new_pos)
                        
        elif piece.type == PieceType.PAWN:
            # Pawn movement depends on whether it has moved and its locked direction
            if piece.pawn_direction is None:
                # First move: can move in any cardinal direction (up, down, left, right)
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    new_pos = (row + dr, col + dc)
                    if self.is_valid_position(new_pos) and self.get_piece(new_pos) is None:
                        moves.add(new_pos)
            else:
                # Subsequent moves: can only move in the locked direction
                dr, dc = piece.pawn_direction
                new_pos = (row + dr, col + dc)
                if self.is_valid_position(new_pos) and self.get_piece(new_pos) is None:
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
    
    def add_line_moves(self, piece: Piece, moves: Set[Tuple[int, int]], directions: List[Tuple[int, int]]):
        row, col = piece.position
        for dr, dc in directions:
            for i in range(1, BOARD_SIZE):
                new_pos = (row + i*dr, col + i*dc)
                if not self.is_valid_position(new_pos):
                    break
                target = self.get_piece(new_pos)
                if target is None:
                    moves.add(new_pos)
                else:
                    if target.player != piece.player:
                        moves.add(new_pos)
                    break
    
    def move_piece(self, piece: Piece, new_position: Tuple[int, int]) -> bool:
        # Check if the move is valid
        if new_position not in self.valid_moves:
            return False
        
        # Handle capturing a piece
        target = self.get_piece(new_position)
        if target is not None:
            # If capturing a king, eliminate that player
            if target.type == PieceType.KING:
                self.eliminate_player(target.player)
            # Remove the captured piece from the board
            self.pieces.remove(target)
            old_row, old_col = target.position
            self.board[old_row][old_col] = None
        
        # Update piece position
        old_row, old_col = piece.position
        new_row, new_col = new_position
        self.board[old_row][old_col] = None
        self.board[new_row][new_col] = piece
        piece.position = new_position
        piece.has_moved = True
        
        # Handle pawn direction locking
        if piece.type == PieceType.PAWN and piece.pawn_direction is None:
            piece.pawn_direction = (new_row - old_row, new_col - old_col)
        
        # Check for win condition
        self.check_win_condition()
        
        return True
    
    def eliminate_player(self, player: int):
        # Mark player as eliminated
        if not self.players[player]:
            return  # Already eliminated
            
        self.players[player] = False
        
        # Transfer all pieces to the current player
        for piece in self.pieces[:]:
            if piece.player == player:
                piece.player = self.current_player
                # If the piece was a king, change it to a queen since there can only be one king
                if piece.type == PieceType.KING:
                    piece.type = PieceType.QUEEN
    
    def check_win_condition(self):
        # Count active players
        active_players = [i for i, active in enumerate(self.players) if active]
        
        # If only one player remains, they win
        if len(active_players) == 1:
            self.winner = active_players[0]
            return
            
        # If current player has been eliminated, move to next player
        if not self.players[self.current_player]:
            self.next_turn()
            return
        
        # Check if current player has any valid moves
        has_valid_moves = False
        for piece in self.pieces:
            if piece.player == self.current_player and self.get_valid_moves(piece):
                has_valid_moves = True
                break
        
        # If no valid moves, eliminate current player and check win condition again
        if not has_valid_moves:
            self.players[self.current_player] = False
            self.check_win_condition()
    
    def next_turn(self):
        # Find next active player
        while True:
            self.current_player = (self.current_player + 1) % 4
            if self.players[self.current_player]:
                break
                
        # Reset selection for next player
        self.selected_piece = None
        self.valid_moves = set()

class AIPlayer:
    def __init__(self, difficulty: str = 'easy'):
        self.difficulty = difficulty
        self.think_time = 0.5  # seconds to "think" before making a move
        
    def evaluate_board(self, game: 'Game', player: int) -> float:
        """Evaluate the board state from the perspective of the given player."""
        if not game.players[player]:
            return float('-inf')  # Player is eliminated
            
        score = 0
        piece_values = {
            PieceType.PAWN: 1,
            PieceType.KNIGHT: 3,
            PieceType.BISHOP: 3,
            PieceType.ROOK: 5,
            PieceType.QUEEN: 9,
            PieceType.KING: 1000  # Very high value to prioritize king safety
        }
        
        # Count material
        for piece in game.pieces:
            if piece.player == player:
                score += piece_values.get(piece.type, 0)
            else:
                score -= piece_values.get(piece.type, 0)
                
        # Add bonuses for having more pieces near the center
        center_bonus = 0
        center_squares = [(3, 3), (3, 4), (4, 3), (4, 4)]
        for piece in game.pieces:
            if piece.player == player and piece.position in center_squares:
                center_bonus += 0.1
        score += center_bonus
        
        return score
    
    def get_best_move(self, game: 'Game', player: int) -> Tuple[Optional[Piece], Optional[Tuple[int, int]]]:
        """Find the best move for the current player based on difficulty."""
        best_score = float('-inf')
        best_move = (None, None)
        
        # Get all possible moves for the player
        for piece in game.pieces:
            if piece.player != player or not game.players[player]:
                continue
                
            valid_moves = game.get_valid_moves(piece)
            for move in valid_moves:
                # Simulate the move
                original_position = piece.position
                target_piece = game.get_piece(move)
                
                # Make the move
                if target_piece:
                    game.pieces.remove(target_piece)
                piece.position = move
                
                # Evaluate the board
                score = self.evaluate_board(game, player)
                
                # For harder difficulties, look ahead
                if self.difficulty == 'hard':
                    # Simulate opponent's best response
                    game.current_player = (player + 1) % 4
                    _, opponent_move = self.get_best_move(game, game.current_player)
                    if opponent_move[0]:  # If opponent has a valid move
                        opponent_score = self.evaluate_board(game, game.current_player)
                        score -= opponent_score * 0.5  # Consider opponent's best response
                    game.current_player = player
                
                # Undo the move
                piece.position = original_position
                if target_piece:
                    game.pieces.append(target_piece)
                
                # Update best move
                if score > best_score or (score == best_score and random.random() < 0.3):
                    best_score = score
                    best_move = (piece, move)
        
        return best_move
    
    def make_move(self, game: 'Game', player: int) -> bool:
        """Make a move for the AI player."""
        time.sleep(self.think_time)  # Simulate thinking time
        piece, move = self.get_best_move(game, player)
        if piece and move:
            return game.move_piece(piece, move)
        return False

class GameUI:
    def __init__(self):
        self.screen = pygame.display.set_mode((WINDOW_SIZE, WINDOW_SIZE))
        pygame.display.set_caption("4-Way Corner Chess")
        self.clock = pygame.time.Clock()
        self.game = Game()
        self.ai_players = [None, None, None, None]  # AI players for each position
        self.load_images()
        self.setup_ai_players()
    
    def setup_ai_players(self):
        """Setup AI players based on user input."""
        # For now, let's make players 1, 2, and 3 AI-controlled (0 is human)
        # In a real game, you'd want to make this configurable
        self.ai_players[1] = AIPlayer(difficulty='medium')
        self.ai_players[2] = AIPlayer(difficulty='hard')
        self.ai_players[3] = AIPlayer(difficulty='easy')
    
    def handle_ai_turn(self):
        """Handle the AI's turn."""
        current_player = self.game.current_player
        ai_player = self.ai_players[current_player]
        
        if ai_player and self.game.players[current_player]:
            if ai_player.make_move(self.game, current_player):
                self.game.next_turn()
                return True
        return False
    
    def load_images(self):
        self.piece_images = {}
        piece_types = ["king", "queen", "rook", "bishop", "knight", "pawn"]
        colors = ["black", "blue", "white", "red"]
        
        for i, color in enumerate(colors):
            for piece_type in piece_types:
                # Create a colored circle for each piece type and color
                surface = pygame.Surface((PIECE_SIZE, PIECE_SIZE), pygame.SRCALPHA)
                
                # Draw the outer circle (player color)
                pygame.draw.circle(surface, PLAYER_COLORS[i] + (200,), 
                                 (PIECE_SIZE//2, PIECE_SIZE//2), PIECE_SIZE//2 - 5)
                
                # Draw the inner circle (white for all pieces)
                pygame.draw.circle(surface, (255, 255, 255), 
                                 (PIECE_SIZE//2, PIECE_SIZE//2), PIECE_SIZE//3)
                
                # Add a letter for the piece type
                font = pygame.font.SysFont('Arial', PIECE_SIZE//2)
                # For knights, render 'Kn' with 'n' as subscript
                if piece_type == 'knight':
                    # Render 'K'
                    text_k = font.render('K', True, (0, 0, 0))
                    text_rect_k = text_k.get_rect(center=(PIECE_SIZE//2 - 5, PIECE_SIZE//2))
                    surface.blit(text_k, text_rect_k)
                    # Render 'n' as subscript
                    small_font = pygame.font.SysFont('Arial', PIECE_SIZE//3)
                    text_n = small_font.render('n', True, (0, 0, 0))
                    text_rect_n = text_n.get_rect(midleft=(PIECE_SIZE//2 + 5, PIECE_SIZE//2 + 5))
                    surface.blit(text_n, text_rect_n)
                else:
                    # For other pieces, just use the first letter
                    text = font.render(piece_type[0].upper(), True, (0, 0, 0))
                    text_rect = text.get_rect(center=(PIECE_SIZE//2, PIECE_SIZE//2))
                    surface.blit(text, text_rect)
                
                self.piece_images[f"{color}_{piece_type}"] = surface
    
    def draw_board(self):
        # Draw the checkerboard
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                color = GRAY if (row + col) % 2 == 0 else WHITE
                pygame.draw.rect(self.screen, color, 
                               (col * SQUARE_SIZE, row * SQUARE_SIZE, 
                                SQUARE_SIZE, SQUARE_SIZE))
        
        # Highlight the current player's corner
        corners = [(0, 0), (0, BOARD_SIZE-1), (BOARD_SIZE-1, BOARD_SIZE-1), (BOARD_SIZE-1, 0)]
        corner_row, corner_col = corners[self.game.current_player]
        highlight_surface = pygame.Surface((SQUARE_SIZE * 3, SQUARE_SIZE * 3), pygame.SRCALPHA)
        highlight_surface.fill(PLAYER_HIGHLIGHTS[self.game.current_player] + (100,))
        self.screen.blit(highlight_surface, (corner_col * SQUARE_SIZE, corner_row * SQUARE_SIZE))
        
        # Highlight selected piece and valid moves
        if self.game.selected_piece:
            row, col = self.game.selected_piece.position
            highlight = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE), pygame.SRCALPHA)
            highlight.fill((255, 255, 0, 100))  # Yellow highlight
            self.screen.blit(highlight, (col * SQUARE_SIZE, row * SQUARE_SIZE))
            
            for move in self.game.valid_moves:
                move_row, move_col = move
                target = self.game.get_piece(move)
                if target is None:
                    # Draw a small circle for empty squares
                    center = ((move_col + 0.5) * SQUARE_SIZE, (move_row + 0.5) * SQUARE_SIZE)
                    pygame.draw.circle(self.screen, (255, 255, 0, 150), 
                                     (int(center[0]), int(center[1])) , 10)
                else:
                    # Draw a circle around capturable pieces
                    highlight = pygame.Surface((SQUARE_SIZE, SQUARE_SIZE), pygame.SRCALPHA)
                    pygame.draw.circle(highlight, (255, 0, 0, 150), 
                                     (SQUARE_SIZE//2, SQUARE_SIZE//2), 
                                     SQUARE_SIZE//2 - 5, 3)
                    self.screen.blit(highlight, (move_col * SQUARE_SIZE, move_row * SQUARE_SIZE))
        
        # Draw pieces
        for piece in self.game.pieces:
            row, col = piece.position
            piece_img = self.piece_images[f"{['black', 'blue', 'white', 'red'][piece.player]}_{piece.type.value}"]
            self.screen.blit(piece_img, 
                           (col * SQUARE_SIZE + (SQUARE_SIZE - PIECE_SIZE) // 2, 
                            row * SQUARE_SIZE + (SQUARE_SIZE - PIECE_SIZE) // 2))
        
        # Draw game status
        font = pygame.font.SysFont('Arial', 24)
        status_text = f"Player {self.game.current_player + 1}'s turn"
        if self.game.winner is not None:
            status_text = f"Player {self.game.winner + 1} wins!"
        
        text_surface = font.render(status_text, True, BLACK)
        self.screen.blit(text_surface, (10, 10))
        
        pygame.display.flip()
    
    def handle_click(self, pos):
        if self.game.winner is not None:
            return
            
        col = pos[0] // SQUARE_SIZE
        row = pos[1] // SQUARE_SIZE
        
        if not (0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE):
            return
        
        clicked_piece = self.game.get_piece((row, col))
        
        # If a piece is already selected
        if self.game.selected_piece:
            # If clicking on another piece of the same player, select it
            if clicked_piece and clicked_piece.player == self.game.current_player:
                self.game.selected_piece = clicked_piece
                self.game.valid_moves = self.game.get_valid_moves(clicked_piece)
            # If clicking on a valid move, make the move
            elif (row, col) in self.game.valid_moves:
                piece = self.game.selected_piece
                if self.game.move_piece(piece, (row, col)):
                    self.game.next_turn()
            # Otherwise, deselect
            else:
                self.game.selected_piece = None
                self.game.valid_moves = set()
        # If no piece is selected, select the clicked piece if it belongs to the current player
        elif clicked_piece and clicked_piece.player == self.game.current_player:
            self.game.selected_piece = clicked_piece
            self.game.valid_moves = self.game.get_valid_moves(clicked_piece)
    
    def run(self):
        running = True
        while running:
            current_player = self.game.current_player
            
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:  # Left click
                    if self.ai_players[current_player] is None:  # Only handle clicks for human players
                        self.handle_click(event.pos)
            
            # Handle AI turn if current player is AI
            if self.game.winner is None and self.ai_players[current_player] is not None:
                self.handle_ai_turn()
            
            # Draw the game state
            self.screen.fill(WHITE)
            self.draw_board()
            self.clock.tick(60)
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game_ui = GameUI()
    game_ui.run()
