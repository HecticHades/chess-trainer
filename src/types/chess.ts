export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface Square {
  piece: ChessPiece | null;
  square: string; // e.g., 'e4'
}

export type BoardPosition = (ChessPiece | null)[][];

export interface Move {
  from: string;
  to: string;
  promotion?: PieceType;
  san?: string; // Standard Algebraic Notation
  lan?: string; // Long Algebraic Notation
}

export interface GameState {
  fen: string;
  turn: PieceColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
}

export type BotDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export interface BotLevel {
  id: BotDifficulty;
  name: string;
  elo: number;
  depth: number;
  description: string;
  isPremium: boolean;
}

export interface GameHistory {
  move: Move;
  fen: string;
  capturedPiece?: ChessPiece;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}
