import { useCallback, useEffect, useMemo, useState } from 'react';
import ChessBoard from '../components/ChessBoard';
import GameResultModal from '../components/GameResultModal';
import { BotDifficulty, ChessPiece } from '../types/chess';
import { BOT_LEVELS } from '../utils/constants';
import { useGameStore } from '../store/gameStore';
import './GameScreen.css';

interface GameScreenProps {
  botDifficulty: BotDifficulty;
  playerColor: 'white' | 'black';
  onExit: () => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function fenToPositionWithKing(fen: string) {
  const position: (ChessPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  const [boardPart] = fen.split(' ');
  const ranks = boardPart.split('/');
  const currentTurn = fen.split(' ')[1];
  const kingColor = currentTurn === 'w' ? 'w' : 'b';
  let kingSquare: { rank: number; file: number } | undefined;

  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        fileIndex += parseInt(char);
      } else {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase() as ChessPiece['type'];
        position[rankIndex][fileIndex] = { type, color };
        if (type === 'k' && color === kingColor) {
          kingSquare = { rank: rankIndex, file: fileIndex };
        }
        fileIndex++;
      }
    }
  });

  return { position, kingSquare };
}

// Helper to convert board coordinates to chess notation (e.g., [0,0] -> 'a8')
function coordsToSquare(rank: number, file: number): string {
  return `${FILES[file]}${8 - rank}`;
}

// Helper to convert chess notation to board coordinates
function squareToCoords(square: string): { rank: number; file: number } {
  const file = FILES.indexOf(square[0]);
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
    winner,
    moveHistory,
    capturedPieces,
    isPlayerTurn,
    isBotThinking,
    engineEvaluation,
    hintMove,
    pgn,
    initGame,
    selectSquare,
    resetGame,
    makeBotMove,
    requestHint,
    clearHint,
    undoMove,
    resign,
    loadPgn,
  } = useGameStore();

  const [showResultModal, setShowResultModal] = useState(false);
  const [pgnInput, setPgnInput] = useState('');

  const bot = BOT_LEVELS.find((b) => b.id === botDifficulty)!;
  const isFlipped = playerColor === 'black';

  // Initialize game when component mounts
  useEffect(() => {
    initGame(botDifficulty, playerColor);
  }, [botDifficulty, playerColor, initGame]);

  useEffect(() => {
    setPgnInput(pgn);
  }, [pgn]);

  // Trigger bot move when it's bot's turn
  useEffect(() => {
    if (
      !isPlayerTurn &&
      !isBotThinking &&
      (gameStatus === 'playing' || gameStatus === 'check')
    ) {
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
      (gameStatus === 'playing' || gameStatus === 'check')
    ) {
      const timeout = setTimeout(() => {
        makeBotMove();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [playerColor, moveHistory.length, isBotThinking, gameStatus, makeBotMove]);

  // Show result modal when game ends
  useEffect(() => {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw') {
      const timeout = setTimeout(() => {
        setShowResultModal(true);
      }, 1000); // Show modal after 1 second delay
      return () => clearTimeout(timeout);
    }
  }, [gameStatus]);

  const handleSquareClick = useCallback(
    (rank: number, file: number) => {
    // Disable clicks during bot's turn or when game is over
    if (
      !isPlayerTurn ||
      isBotThinking ||
      (gameStatus !== 'playing' && gameStatus !== 'check')
    ) {
      return;
    }
    const square = coordsToSquare(rank, file);
    selectSquare(square);
  },
    [isPlayerTurn, isBotThinking, gameStatus, selectSquare]
  );

  // Convert selected square and legal moves to board coordinates
  const selectedCoords = useMemo(
    () => (selectedSquare ? squareToCoords(selectedSquare) : null),
    [selectedSquare]
  );
  const legalMoveCoords = useMemo(
    () => legalMoves.map((square) => squareToCoords(square)),
    [legalMoves]
  );
  const lastMoveCoords = useMemo(
    () =>
      lastMove
        ? {
            from: squareToCoords(lastMove.from),
            to: squareToCoords(lastMove.to),
          }
        : undefined,
    [lastMove]
  );

  // Get check square if in check
  const { position, kingSquare } = useMemo(() => fenToPositionWithKing(fen), [fen]);
  const checkSquare = useMemo(() => {
    if (!(gameStatus === 'check' || gameStatus === 'checkmate')) {
      return undefined;
    }
    return kingSquare;
  }, [gameStatus, kingSquare]);

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
  const formattedMoves = useMemo(() => {
    const moves: { moveNumber: number; white: string; black?: string }[] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      moves.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1],
      });
    }
    return moves;
  }, [moveHistory]);

  // Get game result for modal
  const getGameResult = (): { result: 'win' | 'loss' | 'draw'; reason: string } => {
    if (gameStatus === 'checkmate') {
      const playerWon =
        (playerColor === 'white' && winner === 'white') ||
        (playerColor === 'black' && winner === 'black');
      return {
        result: playerWon ? 'win' : 'loss',
        reason: playerWon ? `You checkmated ${bot.name}!` : `${bot.name} checkmated you!`,
      };
    } else if (gameStatus === 'stalemate') {
      return {
        result: 'draw',
        reason: 'Stalemate - No legal moves available',
      };
    } else if (gameStatus === 'draw') {
      return {
        result: 'draw',
        reason: 'Draw by insufficient material or repetition',
      };
    }
    return { result: 'draw', reason: 'Game ended' };
  };

  const gameResult = getGameResult();

  // Handle resign with confirmation
  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign?')) {
      resign();
    }
  };

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

  const handleCopyPgn = async () => {
    try {
      await navigator.clipboard.writeText(pgn);
    } catch (error) {
      console.error('Failed to copy PGN:', error);
    }
  };

  const handleLoadPgn = () => {
    const success = loadPgn(pgnInput);
    if (!success) {
      alert('Invalid PGN. Please check the notation and try again.');
    }
  };

  const renderEvaluation = () => {
    if (engineEvaluation.mate !== null) {
      const mateValue =
        (playerColor === 'white' ? engineEvaluation.mate : -engineEvaluation.mate) ?? 0;
      return `Mate in ${mateValue}`;
    }
    if (engineEvaluation.score !== null) {
      const normalized =
        playerColor === 'white' ? engineEvaluation.score : -engineEvaluation.score;
      const score = (normalized / 100).toFixed(2);
      return `${score} eval`;
    }
    return 'No eval yet';
  };

  const evaluationValue = useMemo(() => {
    if (engineEvaluation.mate !== null) {
      const mateValue =
        playerColor === 'white' ? engineEvaluation.mate : -engineEvaluation.mate;
      return mateValue > 0 ? 100 : 0;
    }
    if (engineEvaluation.score === null) {
      return 50;
    }
    const normalized =
      playerColor === 'white' ? engineEvaluation.score : -engineEvaluation.score;
    const clamped = Math.max(-1000, Math.min(1000, normalized));
    return ((clamped + 1000) / 2000) * 100;
  }, [engineEvaluation, playerColor]);

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
            <div className="info-item evaluation-item">
              <span className="label">Engine Eval:</span>
              <span className="value">{renderEvaluation()}</span>
            </div>
            <div className="evaluation-bar">
              <div className="evaluation-bar-fill" style={{ width: `${evaluationValue}%` }} />
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
            <button
              className="btn btn-secondary"
              onClick={undoMove}
              disabled={moveHistory.length === 0 || !isPlayerTurn || isBotThinking}
            >
              Undo Move
            </button>
            <button className="btn btn-secondary" onClick={resetGame}>
              New Game
            </button>
            <button
              className="btn btn-outline"
              onClick={requestHint}
              disabled={!isPlayerTurn || isBotThinking}
            >
              Get Hint
            </button>
            {hintMove && (
              <div className="hint-display">
                <span>Best move: {hintMove}</span>
                <button className="btn btn-link" onClick={clearHint}>
                  Clear
                </button>
              </div>
            )}
            <button
              className="btn btn-danger"
              onClick={handleResign}
              disabled={gameStatus !== 'playing' && gameStatus !== 'check'}
            >
              Resign
            </button>
          </div>

          <div className="card">
            <div className="card-title">Analysis & PGN</div>
            <textarea
              className="pgn-textarea"
              value={pgnInput}
              onChange={(event) => setPgnInput(event.target.value)}
              rows={8}
            />
            <div className="pgn-actions">
              <button className="btn btn-secondary" onClick={handleCopyPgn} disabled={!pgn}>
                Copy PGN
              </button>
              <button className="btn btn-outline" onClick={handleLoadPgn}>
                Load PGN
              </button>
            </div>
            {engineEvaluation.pv && (
              <div className="pv-line">
                <strong>PV:</strong> {engineEvaluation.pv}
              </div>
            )}
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

      <GameResultModal
        isOpen={showResultModal}
        result={gameResult.result}
        reason={gameResult.reason}
        onNewGame={() => {
          setShowResultModal(false);
          resetGame();
        }}
        onExit={onExit}
      />
    </div>
  );
}

export default GameScreen;
