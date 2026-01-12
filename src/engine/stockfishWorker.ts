/// <reference lib="webworker" />

interface EngineEvaluation {
  score: number | null;
  mate: number | null;
  pv: string | null;
}

const loadStockfish = () => {
  if (typeof self.importScripts === 'function') {
    try {
      self.importScripts('/stockfish.js');
    } catch (error) {
      console.warn('Local Stockfish load failed, trying CDN.', error);
    }

    if (!(self as any).Stockfish) {
      try {
        self.importScripts('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/stockfish.js');
      } catch (error) {
        console.error('CDN Stockfish load failed.', error);
      }
    }
  }

  return (self as unknown as {
    Stockfish?: () => { onmessage: unknown; postMessage: (msg: string) => void };
  }).Stockfish;
};

const Stockfish = loadStockfish();
if (!Stockfish) {
  const message = 'Stockfish engine failed to load. Ensure /stockfish.js is available.';
  postMessage({ type: 'error', message });
  throw new Error(message);
}

const engine = Stockfish();
let latestEvaluation: EngineEvaluation = { score: null, mate: null, pv: null };
let isReady = false;
let lastInfoSentAt = 0;
const INFO_THROTTLE_MS = 150;

const resetEvaluation = () => {
  latestEvaluation = { score: null, mate: null, pv: null };
};

const parseInfoLine = (line: string) => {
  const tokens = line.split(' ');
  const scoreIndex = tokens.indexOf('score');
  const pvIndex = tokens.indexOf('pv');

  if (scoreIndex !== -1) {
    const type = tokens[scoreIndex + 1];
    const value = parseInt(tokens[scoreIndex + 2], 10);
    if (type === 'cp') {
      latestEvaluation = { ...latestEvaluation, score: value, mate: null };
    }
    if (type === 'mate') {
      latestEvaluation = { ...latestEvaluation, mate: value, score: null };
    }
  }

  if (pvIndex !== -1) {
    const pvMoves = tokens.slice(pvIndex + 1).join(' ');
    latestEvaluation = { ...latestEvaluation, pv: pvMoves };
  }
};

const sendEvaluation = () => {
  const now = Date.now();
  if (now - lastInfoSentAt < INFO_THROTTLE_MS) {
    return;
  }
  lastInfoSentAt = now;
  postMessage({ type: 'info', evaluation: latestEvaluation });
};

engine.onmessage = (event: MessageEvent | string) => {
  const line = typeof event === 'string' ? event : event.data;

  if (line === 'uciok') {
    return;
  }

  if (line === 'readyok') {
    if (!isReady) {
      isReady = true;
      postMessage({ type: 'ready' });
    }
    return;
  }

  if (line.startsWith('info')) {
    parseInfoLine(line);
    sendEvaluation();
    return;
  }

  if (line.startsWith('bestmove')) {
    const move = line.split(' ')[1] ?? '(none)';
    postMessage({ type: 'bestmove', move, evaluation: latestEvaluation });
  }
};

self.onmessage = (event: MessageEvent) => {
  const message = event.data as
    | { type: 'init' }
    | { type: 'newgame' }
    | { type: 'position'; fen: string }
    | { type: 'go'; depth: number };

  if (message.type === 'init') {
    engine.postMessage('uci');
    engine.postMessage('isready');
    return;
  }

  if (message.type === 'newgame') {
    resetEvaluation();
    engine.postMessage('ucinewgame');
    engine.postMessage('isready');
    return;
  }

  if (message.type === 'position') {
    engine.postMessage(`position fen ${message.fen}`);
    return;
  }

  if (message.type === 'go') {
    resetEvaluation();
    engine.postMessage(`go depth ${message.depth}`);
  }
};
