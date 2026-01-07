import { BotLevel } from '../types/chess';

export const BOT_LEVELS: BotLevel[] = [
  {
    id: 'beginner',
    name: 'Beginner Bot',
    elo: 800,
    depth: 1,
    description: 'Perfect for learning the basics',
    isPremium: false,
  },
  {
    id: 'intermediate',
    name: 'Intermediate Bot',
    elo: 1200,
    depth: 3,
    description: 'A fair challenge for casual players',
    isPremium: false,
  },
  {
    id: 'advanced',
    name: 'Advanced Bot',
    elo: 1600,
    depth: 5,
    description: 'Strong tactical play',
    isPremium: true,
  },
  {
    id: 'expert',
    name: 'Expert Bot',
    elo: 2000,
    depth: 10,
    description: 'Club-level strength',
    isPremium: true,
  },
  {
    id: 'master',
    name: 'Master Bot',
    elo: 2400,
    depth: 15,
    description: 'Near grandmaster level',
    isPremium: true,
  },
];

export const PIECE_SYMBOLS = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
};

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Play vs Beginner & Intermediate bots',
      '5 games per day',
      'Basic move history',
    ],
  },
  premium: {
    monthly: {
      name: 'Premium Monthly',
      price: 4.99,
      interval: 'month',
      features: [
        'Unlimited games',
        'All 5 bot difficulty levels',
        'Tactics Trainer (100+ puzzles)',
        'Opening Trainer',
        'Endgame Trainer',
        'Advanced statistics',
        'Custom board themes',
      ],
    },
    yearly: {
      name: 'Premium Yearly',
      price: 39.99,
      interval: 'year',
      savings: 20,
      features: [
        'All Monthly features',
        'Save $20/year (33% off)',
        'Priority support',
      ],
    },
  },
};

export const FREE_GAMES_LIMIT = 5;
