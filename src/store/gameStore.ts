import { create } from 'zustand';
import { Chess } from 'chess.js';
import { BotDifficulty } from '../types/chess';

interface GameState {
  // Chess.js instance
  game: Chess;

  // Game settings
  botDifficulty: BotDifficulty;
  playerColor: 'white' | 'black';

  // Current game state
  fen: string;
  isPlayerTurn: boolean;
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner: 'white' | 'black' | 'draw' | null;

  // Move tracking
  moveHistory: string[];
  capturedPieces: {
    white: string[];
    black: string[];
  };

  // UI state
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;

  // Actions
  initGame: (botDifficulty: BotDifficulty, playerColor: 'white' | 'black') => void;
  selectSquare: (square: string) => void;
  makeMove: (from: string, to: string, promotion?: string) => boolean;
  resetGame: () => void;
  updateGameStatus: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  game: new Chess(),
  botDifficulty: 'beginner',
  playerColor: 'white',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  isPlayerTurn: true,
  gameStatus: 'playing',
  winner: null,
  moveHistory: [],
  capturedPieces: { white: [], black: [] },
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,

  // Initialize new game
  initGame: (botDifficulty, playerColor) => {
    const game = new Chess();
    set({
      game,
      botDifficulty,
      playerColor,
      fen: game.fen(),
      isPlayerTurn: playerColor === 'white',
      gameStatus: 'playing',
      winner: null,
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
    });
  },

  // Select a square and show legal moves
  selectSquare: (square) => {
    const { game, selectedSquare, isPlayerTurn } = get();

    if (!isPlayerTurn) return;

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }

    // If a square is already selected, try to make a move
    if (selectedSquare) {
      const moveSuccess = get().makeMove(selectedSquare, square);
      if (moveSuccess) {
        set({ selectedSquare: null, legalMoves: [] });
        return;
      }
    }

    // Get the piece at the clicked square
    const piece = game.get(square as any);

    // If it's the player's piece, select it and show legal moves
    if (piece && piece.color === (get().playerColor === 'white' ? 'w' : 'b')) {
      const moves = game.moves({ square: square as any, verbose: true });
      const legalMoveSquares = moves.map((move) => move.to);
      set({ selectedSquare: square, legalMoves: legalMoveSquares });
    } else {
      set({ selectedSquare: null, legalMoves: [] });
    }
  },

  // Make a move
  makeMove: (from, to, promotion = 'q') => {
    const { game } = get();

    try {
      // Check if it's a pawn promotion
      const piece = game.get(from as any);
      const isPromotion =
        piece?.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

      // Make the move
      const move = game.move({
        from: from as any,
        to: to as any,
        promotion: isPromotion ? (promotion as any) : undefined,
      });

      if (!move) return false;

      // Track captured pieces
      const capturedPieces = { ...get().capturedPieces };
      if (move.captured) {
        const capturedColor = move.color === 'w' ? 'black' : 'white';
        capturedPieces[capturedColor].push(move.captured);
      }

      // Update state
      set({
        fen: game.fen(),
        moveHistory: game.history(),
        capturedPieces,
        lastMove: { from, to },
        isPlayerTurn: false,
      });

      // Update game status
      get().updateGameStatus();

      return true;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  },

  // Update game status (check, checkmate, stalemate, draw)
  updateGameStatus: () => {
    const { game } = get();

    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'black' : 'white';
      set({ gameStatus: 'checkmate', winner });
    } else if (game.isStalemate()) {
      set({ gameStatus: 'stalemate', winner: 'draw' });
    } else if (game.isDraw()) {
      set({ gameStatus: 'draw', winner: 'draw' });
    } else if (game.isCheck()) {
      set({ gameStatus: 'check' });
    } else {
      set({ gameStatus: 'playing' });
    }
  },

  // Reset game
  resetGame: () => {
    const { botDifficulty, playerColor } = get();
    get().initGame(botDifficulty, playerColor);
  },
}));
