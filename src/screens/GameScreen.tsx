import { useState, useEffect } from 'react';
import ChessBoard from '../components/ChessBoard';
import { BotDifficulty, ChessPiece } from '../types/chess';
import { STARTING_FEN, BOT_LEVELS } from '../utils/constants';
import './GameScreen.css';

interface GameScreenProps {
  botDifficulty: BotDifficulty;
  playerColor: 'white' | 'black';
  onExit: () => void;
}

// Helper function to parse FEN and create board position
function fenToPosition(fen: string): (ChessPiece | null)[][] {
  const position: (ChessPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const [boardPart] = fen.split(' ');
  const ranks = boardPart.split('/');

  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        fileIndex += parseInt(char);
      } else {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase() as ChessPiece['type'];
        position[rankIndex][fileIndex] = { type, color };
        fileIndex++;
      }
    }
  });

  return position;
}

function GameScreen({ botDifficulty, playerColor, onExit }: GameScreenProps) {
  const [position, setPosition] = useState<(ChessPiece | null)[][]>(
    fenToPosition(STARTING_FEN)
  );
  const [selectedSquare, setSelectedSquare] = useState<{ rank: number; file: number } | null>(null);

  const bot = BOT_LEVELS.find((b) => b.id === botDifficulty)!;
  const isFlipped = playerColor === 'black';

  const handleSquareClick = (rank: number, file: number) => {
    // For now, just select/deselect squares
    // Move logic will be added in Phase 2
    if (selectedSquare?.rank === rank && selectedSquare?.file === file) {
      setSelectedSquare(null);
    } else {
      setSelectedSquare({ rank, file });
    }
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="opponent-info">
          <h2>{bot.name}</h2>
          <span className="elo-badge">ELO {bot.elo}</span>
        </div>
        <div className="game-actions">
          <button className="btn btn-outline" onClick={onExit}>
            ← Exit
          </button>
        </div>
      </div>

      <div className="game-content">
        <div className="game-sidebar">
          <div className="card">
            <div className="card-title">Game Info</div>
            <div className="info-item">
              <span className="label">You:</span>
              <span className="value">{playerColor === 'white' ? '♔ White' : '♚ Black'}</span>
            </div>
            <div className="info-item">
              <span className="label">Opponent:</span>
              <span className="value">{bot.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value status-playing">In Progress</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Move History</div>
            <div className="move-history">
              <p className="empty-state">No moves yet</p>
            </div>
          </div>

          <div className="game-controls">
            <button className="btn btn-secondary" disabled>
              Undo
            </button>
            <button className="btn btn-danger" disabled>
              Resign
            </button>
          </div>
        </div>

        <div className="board-container">
          <ChessBoard
            position={position}
            flipped={isFlipped}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
          />
        </div>

        <div className="game-sidebar captured-pieces-sidebar">
          <div className="card">
            <div className="card-title">Captured Pieces</div>
            <div className="captured-section">
              <div className="captured-label">White:</div>
              <div className="captured-pieces">
                <p className="empty-state">None</p>
              </div>
            </div>
            <div className="captured-section">
              <div className="captured-label">Black:</div>
              <div className="captured-pieces">
                <p className="empty-state">None</p>
              </div>
            </div>
          </div>

          <div className="card tip-card">
            <div className="card-title">💡 Tip</div>
            <p>Click on a piece to select it. Legal moves will be highlighted.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameScreen;
