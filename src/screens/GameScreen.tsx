import { useEffect } from 'react';
import ChessBoard from '../components/ChessBoard';
import { BotDifficulty, ChessPiece } from '../types/chess';
import { BOT_LEVELS } from '../utils/constants';
import { useGameStore } from '../store/gameStore';
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

// Helper to convert board coordinates to chess notation (e.g., [0,0] -> 'a8')
function coordsToSquare(rank: number, file: number): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return `${files[file]}${8 - rank}`;
}

// Helper to convert chess notation to board coordinates
function squareToCoords(square: string): { rank: number; file: number } {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const file = files.indexOf(square[0]);
  const rank = 8 - parseInt(square[1]);
  return { rank, file };
}

function GameScreen({ botDifficulty, playerColor, onExit }: GameScreenProps) {
  const {
    fen,
    selectedSquare,
    legalMoves,
    lastMove,
    gameStatus,
    moveHistory,
    capturedPieces,
    isPlayerTurn,
    isBotThinking,
    initGame,
    selectSquare,
    resetGame,
    makeBotMove,
  } = useGameStore();

  const bot = BOT_LEVELS.find((b) => b.id === botDifficulty)!;
  const isFlipped = playerColor === 'black';

  // Initialize game when component mounts
  useEffect(() => {
    initGame(botDifficulty, playerColor);
  }, [botDifficulty, playerColor, initGame]);

  // Trigger bot move when it's bot's turn
  useEffect(() => {
    if (!isPlayerTurn && !isBotThinking && gameStatus === 'playing') {
      // Add small delay for better UX (so player can see their move)
      const timeout = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isPlayerTurn, isBotThinking, gameStatus, makeBotMove]);

  // If player is black, bot moves first
  useEffect(() => {
    if (
      playerColor === 'black' &&
      moveHistory.length === 0 &&
      !isBotThinking &&
      gameStatus === 'playing'
    ) {
      const timeout = setTimeout(() => {
        makeBotMove();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [playerColor, moveHistory.length, isBotThinking, gameStatus, makeBotMove]);

  const handleSquareClick = (rank: number, file: number) => {
    // Disable clicks during bot's turn or when game is over
    if (!isPlayerTurn || isBotThinking || gameStatus !== 'playing') {
      return;
    }
    const square = coordsToSquare(rank, file);
    selectSquare(square);
  };

  // Convert selected square and legal moves to board coordinates
  const selectedCoords = selectedSquare ? squareToCoords(selectedSquare) : null;
  const legalMoveCoords = legalMoves.map((square) => squareToCoords(square));
  const lastMoveCoords = lastMove
    ? {
        from: squareToCoords(lastMove.from),
        to: squareToCoords(lastMove.to),
      }
    : undefined;

  // Get check square if in check
  const checkSquare =
    gameStatus === 'check' || gameStatus === 'checkmate'
      ? (() => {
          // Find the king's square
          const position = fenToPosition(fen);
          const currentTurn = fen.split(' ')[1];
          const kingColor = currentTurn === 'w' ? 'w' : 'b';
          for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
              const piece = position[rank][file];
              if (piece?.type === 'k' && piece.color === kingColor) {
                return { rank, file };
              }
            }
          }
          return undefined;
        })()
      : undefined;

  const position = fenToPosition(fen);

  // Format game status display
  const getStatusDisplay = () => {
    if (isBotThinking) {
      return { text: 'Bot thinking...', className: 'status-check' };
    } else if (gameStatus === 'checkmate') {
      return { text: 'Checkmate!', className: 'status-checkmate' };
    } else if (gameStatus === 'check') {
      return { text: 'Check!', className: 'status-check' };
    } else if (gameStatus === 'stalemate') {
      return { text: 'Stalemate', className: 'status-playing' };
    } else if (gameStatus === 'draw') {
      return { text: 'Draw', className: 'status-playing' };
    } else if (isPlayerTurn) {
      return { text: 'Your turn', className: 'status-playing' };
    } else {
      return { text: "Bot's turn", className: 'status-playing' };
    }
  };

  const status = getStatusDisplay();

  // Format move history (group by move number)
  const formatMoveHistory = () => {
    const moves: { moveNumber: number; white: string; black?: string }[] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      moves.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1],
      });
    }
    return moves;
  };

  const formattedMoves = formatMoveHistory();

  // Render captured pieces with Unicode symbols
  const PIECE_SYMBOLS = {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
    k: '♚',
  };

  const renderCapturedPieces = (pieces: string[]) => {
    if (pieces.length === 0) {
      return <p className="empty-state">None</p>;
    }
    return pieces.map((piece, index) => (
      <span key={index} className="captured-piece">
        {PIECE_SYMBOLS[piece as keyof typeof PIECE_SYMBOLS]}
      </span>
    ));
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
              <span className={`value ${status.className}`}>{status.text}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Move History</div>
            <div className="move-history">
              {formattedMoves.length === 0 ? (
                <p className="empty-state">No moves yet</p>
              ) : (
                formattedMoves.map((move) => (
                  <div key={move.moveNumber} className="move-item">
                    <span className="move-number">{move.moveNumber}.</span>
                    <span className="move-notation">
                      {move.white} {move.black || ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="game-controls">
            <button className="btn btn-secondary" onClick={resetGame}>
              New Game
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
            selectedSquare={selectedCoords}
            legalMoves={legalMoveCoords}
            lastMove={lastMoveCoords}
            checkSquare={checkSquare}
          />
        </div>

        <div className="game-sidebar captured-pieces-sidebar">
          <div className="card">
            <div className="card-title">Captured Pieces</div>
            <div className="captured-section">
              <div className="captured-label">White captured:</div>
              <div className="captured-pieces">{renderCapturedPieces(capturedPieces.white)}</div>
            </div>
            <div className="captured-section">
              <div className="captured-label">Black captured:</div>
              <div className="captured-pieces">{renderCapturedPieces(capturedPieces.black)}</div>
            </div>
          </div>

          <div className="card tip-card">
            <div className="card-title">💡 Tip</div>
            <p>
              Click a piece to select it, then click a highlighted square to move. Special moves
              like castling and en passant work automatically!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameScreen;
