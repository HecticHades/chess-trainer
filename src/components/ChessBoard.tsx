import { PIECE_SYMBOLS, FILES, RANKS } from '../utils/constants';
import { ChessPiece } from '../types/chess';
import './ChessBoard.css';

interface ChessBoardProps {
  position: (ChessPiece | null)[][];
  flipped?: boolean;
  onSquareClick?: (rank: number, file: number) => void;
  selectedSquare?: { rank: number; file: number } | null;
  legalMoves?: string[];
  lastMove?: { from: string; to: string } | null;
  checkSquare?: string | null;
}

function ChessBoard({
  position,
  flipped = false,
  onSquareClick,
  selectedSquare,
  legalMoves = [],
  lastMove,
  checkSquare,
}: ChessBoardProps) {
  const renderSquare = (rank: number, file: number) => {
    const piece = position[rank][file];
    const isLight = (rank + file) % 2 === 0;
    const squareName = `${FILES[file]}${8 - rank}`;

    const isSelected =
      selectedSquare?.rank === rank && selectedSquare?.file === file;
    const isLegalMove = legalMoves.includes(squareName);
    const isLastMove =
      lastMove &&
      (lastMove.from === squareName || lastMove.to === squareName);
    const isCheck = checkSquare === squareName;

    const handleClick = () => {
      onSquareClick?.(rank, file);
    };

    return (
      <div
        key={`${rank}-${file}`}
        className={`
          square
          ${isLight ? 'light' : 'dark'}
          ${isSelected ? 'selected' : ''}
          ${isLastMove ? 'last-move' : ''}
          ${isCheck ? 'check' : ''}
        `}
        onClick={handleClick}
      >
        {piece && (
          <div className="piece">
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </div>
        )}
        {isLegalMove && <div className="legal-move-indicator" />}

        {/* Coordinates */}
        {file === 0 && (
          <div className="rank-label">{RANKS[rank]}</div>
        )}
        {rank === 7 && (
          <div className="file-label">{FILES[file]}</div>
        )}
      </div>
    );
  };

  const renderBoard = () => {
    const rows = [];
    for (let rank = 0; rank < 8; rank++) {
      const squares = [];
      for (let file = 0; file < 8; file++) {
        squares.push(renderSquare(rank, file));
      }
      rows.push(
        <div key={rank} className="board-row">
          {squares}
        </div>
      );
    }
    return flipped ? rows.reverse() : rows;
  };

  return (
    <div className={`chess-board ${flipped ? 'flipped' : ''}`}>
      {renderBoard()}
    </div>
  );
}

export default ChessBoard;
