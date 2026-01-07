import { BotDifficulty } from '../types/chess';
import { BOT_LEVELS } from '../utils/constants';

class StockfishEngine {
  private engine: Worker | null = null;
  private isReady = false;
  private pendingMessages: string[] = [];
  private messageHandlers: ((message: string) => void)[] = [];

  async init() {
    if (this.engine) return;

    return new Promise<void>((resolve, reject) => {
      try {
        // Create inline worker with Stockfish WASM
        const workerCode = `
          // Load Stockfish from CDN
          importScripts('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/stockfish.js');

          let stockfish;

          self.onmessage = function(e) {
            const msg = e.data;

            if (msg === 'init') {
              Stockfish().then(sf => {
                stockfish = sf;
                stockfish.addMessageListener(line => {
                  self.postMessage(line);
                });
                self.postMessage('ready');
              });
            } else if (stockfish) {
              stockfish.postMessage(msg);
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.engine = new Worker(workerUrl);

        this.engine.onmessage = (event: MessageEvent) => {
          const message = event.data;

          if (message === 'ready') {
            this.send('uci');
          } else if (message === 'uciok') {
            this.isReady = true;
            this.pendingMessages.forEach((msg) => this.send(msg));
            this.pendingMessages = [];
            resolve();
          }

          // Call registered handlers
          this.messageHandlers.forEach((handler) => handler(message));
        };

        this.engine.onerror = (error) => {
          console.error('Stockfish worker error:', error);
          reject(error);
        };

        // Initialize the worker
        this.engine.postMessage('init');
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        reject(error);
      }
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
        this.messageHandlers = this.messageHandlers.filter((h) => h !== messageHandler);
        reject(new Error('Stockfish timeout'));
      }, 30000); // 30 second timeout

      const messageHandler = (message: string) => {
        // Look for bestmove response
        if (typeof message === 'string' && message.startsWith('bestmove')) {
          clearTimeout(timeout);
          const parts = message.split(' ');
          const bestMove = parts[1];

          // Remove this handler
          this.messageHandlers = this.messageHandlers.filter((h) => h !== messageHandler);

          resolve(bestMove);
        }
      };

      // Register message handler
      this.messageHandlers.push(messageHandler);

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
