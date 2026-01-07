import { Chess } from 'chess.js';
import { BotDifficulty } from '../types/chess';

// Simple chess AI engine using minimax-style evaluation
class ChessEngine {
  // Piece values for evaluation
  private pieceValues: { [key: string]: number } = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };

  async getBestMove(fen: string, difficulty: BotDifficulty): Promise<string> {
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });

    if (moves.length === 0) {
      throw new Error('No legal moves available');
    }

    // Get difficulty settings
    const settings = this.getDifficultySettings(difficulty);

    // Sometimes make random moves based on difficulty
    if (Math.random() < settings.randomness) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return `${randomMove.from}${randomMove.to}${randomMove.promotion || ''}`;
    }

    // Evaluate moves and pick the best one
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      const testGame = new Chess(fen);
      testGame.move(move);

      let score = this.evaluatePosition(testGame, settings.depth);

      // Add some randomness to make it less perfect
      score += (Math.random() - 0.5) * settings.randomFactor;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return `${bestMove.from}${bestMove.to}${bestMove.promotion || ''}`;
  }

  private getDifficultySettings(difficulty: BotDifficulty) {
    switch (difficulty) {
      case 'beginner':
        return { depth: 1, randomness: 0.7, randomFactor: 5 }; // 70% random moves
      case 'intermediate':
        return { depth: 1, randomness: 0.3, randomFactor: 3 }; // 30% random moves
      case 'advanced':
        return { depth: 2, randomness: 0.1, randomFactor: 1 }; // 10% random moves
      case 'expert':
        return { depth: 2, randomness: 0.05, randomFactor: 0.5 }; // 5% random moves
      case 'master':
        return { depth: 3, randomness: 0, randomFactor: 0.2 }; // No random moves
      default:
        return { depth: 1, randomness: 0.3, randomFactor: 3 };
    }
  }

  private evaluatePosition(game: Chess, depth: number): number {
    // Check terminal conditions
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? -10000 : 10000;
    }
    if (game.isStalemate() || game.isDraw()) {
      return 0;
    }

    // Base evaluation: material count
    let score = this.evaluateMaterial(game);

    // Add bonuses for good moves
    if (game.isCheck()) {
      score += game.turn() === 'w' ? -50 : 50; // Bonus for putting opponent in check
    }

    // Simple depth search
    if (depth > 1) {
      const moves = game.moves({ verbose: true });
      let bestScore = -Infinity;

      for (const move of moves.slice(0, 10)) { // Limit to 10 moves for performance
        const testGame = new Chess(game.fen());
        testGame.move(move);
        const moveScore = -this.evaluatePosition(testGame, depth - 1);
        bestScore = Math.max(bestScore, moveScore);
      }

      score = bestScore;
    }

    return score;
  }

  private evaluateMaterial(game: Chess): number {
    const board = game.board();
    let score = 0;

    for (const row of board) {
      for (const square of row) {
        if (square) {
          const value = this.pieceValues[square.type];
          score += square.color === 'b' ? value : -value;
        }
      }
    }

    return score;
  }
}

// Singleton instance
export const stockfishEngine = new ChessEngine();
