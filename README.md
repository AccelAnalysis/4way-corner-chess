# 4-Way Corner Chess

A unique 4-player chess variant playable as both a desktop (Pygame) application and a modern web app with AI support. Players start from each corner of the board. The last player with a king remaining wins!

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Game Rules](#game-rules)
- [Installation](#installation)
- [Running the Game](#running-the-game)
  - [Desktop (Pygame) Version](#desktop-pygame-version)
  - [Web/AI Version](#webai-version)
- [Usage](#usage)
- [Controls](#controls)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Overview

4-Way Corner Chess is a strategic chess variant for four players, each starting from a different corner. The game offers:
- A classic desktop version built with Pygame.
- A web-based version with AI/computer player support, playable in your browser.

---

## Features
- **4-player chess**: Each player controls a unique color and starts from a board corner.
- **AI/computer players**: Play against computer opponents in the web version.
- **Modern web UI**: Play directly in your browser with interactive controls and timer.
- **Unique rules**: Capture kings directly, pawn direction lock, and take over eliminated players' pieces.
- **Flexible player setup**: Choose human or AI for each seat (web version).

---

## Game Rules

- **Players**: 4 (Black, Blue, Green, Red)
- **Starting Positions**:
  - Player 1: Black (top-left)
  - Player 2: Blue (top-right)
  - Player 3: Green (bottom-right)
  - Player 4: Red (bottom-left)

### Objective
Capture another player's king to take control of their remaining pieces. The game continues until only one player remains.

### Special Rules
- **Pawns**: On their first move, pawns can move one square in any direction. After the first move, they are locked into that direction.
- **King Capture**: There is no check or checkmate—kings can be captured like any other piece.
- **Turn Order**: Players take turns in clockwise order. If you capture a king, you take that player's next turn.
- **AI/Timer (Web only)**: Optional chess clocks and computer players.

---

## Installation

1. Ensure you have Python 3.7+ installed.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## Running the Game

### Desktop (Pygame) Version
1. Open a terminal in the project folder.
2. Run:
   ```bash
   python game.py
   ```
3. The game window will open. Play using your mouse.

### Web/AI Version
1. Open a terminal in the `web` directory:
   ```bash
   cd web
   python server.py
   ```
2. The server will start and display local URLs (e.g., `http://localhost:8001`).
3. Open the original or AI version in your browser:
   - **Original:** [http://localhost:8001](http://localhost:8001)
   - **AI Version:** [http://localhost:8001/ai](http://localhost:8001/ai)

---

## Usage

- **Desktop**: Use your mouse to select and move pieces. The current player's corner is highlighted.
- **Web/AI**: Select human or computer for each player, adjust timer and options, and play directly in your browser. Moves and valid options are highlighted. Sound effects and timers are included.

---

## Controls
- **Left-click**: Select/move pieces
- **Close Window**: Quit the game
- **Web/AI**: Use on-screen controls for options, timers, and player types

---

## Dependencies
- Python 3.7+
- [pygame](https://www.pygame.org/) (desktop version)
- [numpy](https://numpy.org/) (desktop version)
- Standard Python libraries (web server)

Install all dependencies with:
```bash
pip install -r requirements.txt
```

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features. See the code comments for structure and guidelines.

---

## License

This project is licensed under the MIT License. See the LICENSE file for more information.

---

## Credits

- Original concept and code: [Jonathan Z. Holman]
- AI and web UI: [Jonathan Z. Holman]
- Sound effects: [mixkit.co](https://mixkit.co)

Special thanks to the open-source community and all contributors!
