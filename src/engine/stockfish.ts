import { BotDifficulty } from '../types/chess';
import { BOT_LEVELS } from '../utils/constants';

interface EngineEvaluation {
  score: number | null;
  mate: number | null;
  pv: string | null;
}

interface BestMoveResponse {
  move: string;
  evaluation: EngineEvaluation;
}

interface PendingRequest {
  resolve: (response: BestMoveResponse) => void;
  reject: (error: Error) => void;
}

class StockfishEngine {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private pendingRequest: PendingRequest | null = null;
  private latestEvaluation: EngineEvaluation = { score: null, mate: null, pv: null };

  private getWorker() {
    if (!this.worker) {
      this.worker = new Worker(new URL('./stockfishWorker.ts', import.meta.url), {
        type: 'classic',
      });
      this.worker.addEventListener('message', this.handleWorkerMessage);
    }
    return this.worker;
  }

  private handleWorkerMessage = (event: MessageEvent) => {
    const message = event.data as
      | { type: 'ready' }
      | { type: 'info'; evaluation: EngineEvaluation }
      | { type: 'bestmove'; move: string; evaluation: EngineEvaluation }
      | { type: 'error'; message: string };

    if (message.type === 'info') {
      this.latestEvaluation = message.evaluation;
    }

    if (message.type === 'error') {
      if (this.pendingRequest) {
        const { reject } = this.pendingRequest;
        this.pendingRequest = null;
        reject(new Error(message.message));
      }
      return;
    }

    if (message.type === 'bestmove' && this.pendingRequest) {
      const { resolve } = this.pendingRequest;
      this.pendingRequest = null;
      resolve({ move: message.move, evaluation: message.evaluation });
    }
  };

  private async ensureReady() {
    if (!this.readyPromise) {
      this.readyPromise = new Promise((resolve) => {
        const worker = this.getWorker();
        const handleReady = (event: MessageEvent) => {
          if (event.data?.type === 'ready') {
            worker.removeEventListener('message', handleReady);
            resolve();
          }
        };
        worker.addEventListener('message', handleReady);
        worker.postMessage({ type: 'init' });
      });
    }
    return this.readyPromise;
  }

  async getBestMove(fen: string, difficulty: BotDifficulty): Promise<BestMoveResponse> {
    const worker = this.getWorker();
    await this.ensureReady();

    if (this.pendingRequest) {
      throw new Error('Engine is already thinking');
    }

    const depth = BOT_LEVELS.find((level) => level.id === difficulty)?.depth ?? 1;

    worker.postMessage({ type: 'position', fen });
    worker.postMessage({ type: 'go', depth });

    return new Promise((resolve, reject) => {
      this.pendingRequest = { resolve, reject };
      setTimeout(() => {
        if (this.pendingRequest) {
          this.pendingRequest = null;
          reject(new Error('Engine move timed out'));
        }
      }, 10000);
    });
  }

  getLatestEvaluation(): EngineEvaluation {
    return this.latestEvaluation;
  }

  reset() {
    if (this.worker) {
      this.worker.postMessage({ type: 'newgame' });
    }
    this.latestEvaluation = { score: null, mate: null, pv: null };
  }
}

export const stockfishEngine = new StockfishEngine();
export type { EngineEvaluation, BestMoveResponse };
