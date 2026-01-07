import { create } from 'zustand';
import { Chess } from 'chess.js';
import { BotDifficulty } from '../types/chess';
import { stockfishEngine } from '../engine/stockfish';

interface GameState {
  // Chess.js instance
  game: Chess;

  // Game settings
  botDifficulty: BotDifficulty;
  playerColor: 'white' | 'black';

  // Current game state
  fen: string;
  isPlayerTurn: boolean;
  isBotThinking: boolean;
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
  makeBotMove: () => Promise<void>;
  undoMove: () => void;
  resign: () => void;
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
  isBotThinking: false,
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

  // Undo last move (undo both player and bot moves)
  undoMove: () => {
    const { game, playerColor, moveHistory } = get();

    if (moveHistory.length === 0) return;

    // Undo twice to undo both player and bot moves
    game.undo(); // Undo bot move
    if (moveHistory.length > 1) {
      game.undo(); // Undo player move
    }

    // Recalculate captured pieces
    const capturedPieces: { white: string[]; black: string[] } = { white: [], black: [] };
    const history = game.history({ verbose: true });
    history.forEach((move) => {
      if (move.captured) {
        const capturedColor = move.color === 'w' ? 'black' : 'white';
        capturedPieces[capturedColor].push(move.captured);
      }
    });

    set({
      fen: game.fen(),
      moveHistory: game.history(),
      capturedPieces,
      lastMove: null,
      selectedSquare: null,
      legalMoves: [],
      isPlayerTurn: playerColor === 'white' ? game.turn() === 'w' : game.turn() === 'b',
      gameStatus: 'playing',
      winner: null,
    });

    get().updateGameStatus();
  },

  // Resign the game
  resign: () => {
    const { playerColor } = get();
    const winner = playerColor === 'white' ? 'black' : 'white';
    set({
      gameStatus: 'checkmate',
      winner,
      isPlayerTurn: false,
    });
  },

  // Reset game
  resetGame: () => {
    const { botDifficulty, playerColor } = get();
    get().initGame(botDifficulty, playerColor);
  },

  // Make bot move using chess engine
  makeBotMove: async () => {
    const { game, botDifficulty, fen, gameStatus } = get();

    // Don't make a move if game is over
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw') {
      return;
    }

    set({ isBotThinking: true });

    try {
      // Get best move from chess engine
      const bestMove = await stockfishEngine.getBestMove(fen, botDifficulty);

      if (!bestMove || bestMove === '(none)') {
        console.error('No valid move from engine');
        set({ isBotThinking: false });
        return;
      }

      // Parse the move (format: "e2e4" or "e7e8q" for promotion)
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      const promotion = bestMove.length > 4 ? bestMove[4] : 'q';

      // Make the move
      const piece = game.get(from as any);
      const isPromotion =
        piece?.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

      const move = game.move({
        from: from as any,
        to: to as any,
        promotion: isPromotion ? (promotion as any) : undefined,
      });

      if (!move) {
        console.error('Invalid bot move:', bestMove);
        set({ isBotThinking: false });
        return;
      }

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
        isPlayerTurn: true,
        isBotThinking: false,
      });

      // Update game status
      get().updateGameStatus();
    } catch (error) {
      console.error('Error making bot move:', error);
      set({ isBotThinking: false, isPlayerTurn: true });
    }
  },
}));
