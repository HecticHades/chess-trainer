import { useState } from 'react';
import { BOT_LEVELS } from '../utils/constants';
import { BotDifficulty } from '../types/chess';
import { useUserStore } from '../store/userStore';
import SubscriptionModal from '../components/SubscriptionModal';
import './HomeScreen.css';

interface HomeScreenProps {
  onStartGame: (bot: BotDifficulty, color: 'white' | 'black') => void;
}

function HomeScreen({ onStartGame }: HomeScreenProps) {
  const [selectedBot, setSelectedBot] = useState<BotDifficulty>('beginner');
  const [selectedColor, setSelectedColor] = useState<'white' | 'black'>('white');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionReason, setSubscriptionReason] = useState<'premium_bot' | 'game_limit'>(
    'premium_bot'
  );

  const { isPremium, canPlayGame, incrementGamesPlayed, unlockPremium } = useUserStore();

  const handleBotClick = (botId: BotDifficulty, botIsPremium: boolean) => {
    if (botIsPremium && !isPremium) {
      setSubscriptionReason('premium_bot');
      setShowSubscriptionModal(true);
    } else {
      setSelectedBot(botId);
    }
  };

  const handleStartGame = () => {
    // Check if user can play (game limit for free users)
    if (!canPlayGame()) {
      setSubscriptionReason('game_limit');
      setShowSubscriptionModal(true);
      return;
    }

    // Increment games played count
    incrementGamesPlayed();

    onStartGame(selectedBot, selectedColor);
  };

  const handleUnlockPremium = () => {
    unlockPremium();
    setShowSubscriptionModal(false);
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <div className="header-content">
          <div>
            <h1>♟️ Chess Trainer</h1>
            <p className="tagline">Master chess with AI opponents and premium training</p>
          </div>
          {isPremium ? (
            <div className="premium-status">
              <span className="premium-icon">♔</span>
              <span>Premium</span>
            </div>
          ) : (
            <button
              className="btn btn-outline upgrade-btn"
              onClick={() => {
                setSubscriptionReason('premium_bot');
                setShowSubscriptionModal(true);
              }}
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>

      <div className="home-content">
        <section className="bot-selection">
          <h2>Choose Your Opponent</h2>
          <div className="bot-grid">
            {BOT_LEVELS.map((bot) => {
              const isLocked = bot.isPremium && !isPremium;
              const isSelected = selectedBot === bot.id;
              return (
                <div
                  key={bot.id}
                  className={`bot-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={() => handleBotClick(bot.id, bot.isPremium)}
                  style={{ cursor: 'pointer' }}
                >
                  {isLocked && <div className="lock-overlay">🔒</div>}
                  {bot.isPremium && !isLocked && (
                    <span className="premium-badge">Premium</span>
                  )}
                  <h3>{bot.name}</h3>
                  <div className="elo-rating">ELO: {bot.elo}</div>
                  <p className="bot-description">{bot.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="game-settings">
          <h2>Game Settings</h2>
          <div className="settings-group">
            <label>Play as:</label>
            <div className="color-selector">
              <button
                className={`color-btn ${selectedColor === 'white' ? 'selected' : ''}`}
                onClick={() => setSelectedColor('white')}
              >
                <span className="piece-icon">♔</span>
                White
              </button>
              <button
                className={`color-btn ${selectedColor === 'black' ? 'selected' : ''}`}
                onClick={() => setSelectedColor('black')}
              >
                <span className="piece-icon">♚</span>
                Black
              </button>
            </div>
          </div>

          <button className="btn btn-primary start-game-btn" onClick={handleStartGame}>
            Start Game
          </button>
        </section>

        <section className="features">
          <h2>Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>5 Difficulty Levels</h3>
              <p>From 800 to 2400+ ELO</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📚</span>
              <h3>Training Modules</h3>
              <p>Tactics, openings, endgames</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3>Track Progress</h3>
              <p>Stats and analytics</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⭐</span>
              <h3>Premium Content</h3>
              <p>Unlock advanced features</p>
            </div>
          </div>
        </section>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        reason={subscriptionReason}
        onClose={() => setShowSubscriptionModal(false)}
        onUnlock={handleUnlockPremium}
      />
    </div>
  );
}

export default HomeScreen;
