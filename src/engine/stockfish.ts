import { BotDifficulty } from '../types/chess';
import { BOT_LEVELS } from '../utils/constants';

class StockfishEngine {
  private engine: Worker | null = null;
  private isReady = false;
  private pendingMessages: string[] = [];

  async init() {
    if (this.engine) return;

    return new Promise<void>((resolve) => {
      // Create Stockfish worker
      const Stockfish = require('stockfish');
      this.engine = new Stockfish();

      this.engine!.onmessage = (event: MessageEvent) => {
        const message = event.data || event;

        if (message === 'uciok') {
          this.isReady = true;
          // Process any pending messages
          this.pendingMessages.forEach((msg) => this.send(msg));
          this.pendingMessages = [];
          resolve();
        }
      };

      // Initialize UCI protocol
      this.send('uci');
    });
  }

  private send(command: string) {
    if (!this.engine) {
      console.error('Stockfish engine not initialized');
      return;
    }

    if (!this.isReady && command !== 'uci') {
      this.pendingMessages.push(command);
      return;
    }

    this.engine.postMessage(command);
  }

  async getBestMove(fen: string, difficulty: BotDifficulty): Promise<string> {
    if (!this.engine) {
      await this.init();
    }

    const bot = BOT_LEVELS.find((b) => b.id === difficulty);
    if (!bot) throw new Error('Invalid bot difficulty');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stockfish timeout'));
      }, 30000); // 30 second timeout

      let bestMove = '';

      const messageHandler = (event: MessageEvent) => {
        const message = event.data || event;

        // Look for bestmove response
        if (typeof message === 'string' && message.startsWith('bestmove')) {
          clearTimeout(timeout);
          const parts = message.split(' ');
          bestMove = parts[1];

          if (this.engine) {
            this.engine.removeEventListener('message', messageHandler);
          }

          resolve(bestMove);
        }
      };

      if (this.engine) {
        this.engine.addEventListener('message', messageHandler);
      }

      // Configure Stockfish based on difficulty
      this.send('ucinewgame');
      this.send('isready');

      // Set skill level (0-20, where 20 is strongest)
      const skillLevel = this.getSkillLevel(difficulty);
      this.send(`setoption name Skill Level value ${skillLevel}`);

      // Set position
      this.send(`position fen ${fen}`);

      // Start calculation with depth limit
      const depth = bot.depth;
      const moveTime = this.getMoveTime(difficulty);

      if (depth <= 5) {
        // For lower difficulties, use depth
        this.send(`go depth ${depth}`);
      } else {
        // For higher difficulties, use time-based search
        this.send(`go movetime ${moveTime}`);
      }
    });
  }

  private getSkillLevel(difficulty: BotDifficulty): number {
    switch (difficulty) {
      case 'beginner':
        return 0; // Weakest
      case 'intermediate':
        return 5;
      case 'advanced':
        return 10;
      case 'expert':
        return 15;
      case 'master':
        return 20; // Strongest
      default:
        return 10;
    }
  }

  private getMoveTime(difficulty: BotDifficulty): number {
    // Move time in milliseconds
    switch (difficulty) {
      case 'beginner':
        return 100;
      case 'intermediate':
        return 500;
      case 'advanced':
        return 1000;
      case 'expert':
        return 2000;
      case 'master':
        return 3000;
      default:
        return 1000;
    }
  }

  terminate() {
    if (this.engine) {
      this.send('quit');
      this.engine = null;
      this.isReady = false;
    }
  }
}

// Singleton instance
export const stockfishEngine = new StockfishEngine();
