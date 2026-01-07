import { useState } from 'react';
import { BOT_LEVELS } from '../utils/constants';
import { BotDifficulty } from '../types/chess';
import './HomeScreen.css';

interface HomeScreenProps {
  onStartGame: (bot: BotDifficulty, color: 'white' | 'black') => void;
}

function HomeScreen({ onStartGame }: HomeScreenProps) {
  const [selectedBot, setSelectedBot] = useState<BotDifficulty>('beginner');
  const [selectedColor, setSelectedColor] = useState<'white' | 'black'>('white');

  const handleStartGame = () => {
    onStartGame(selectedBot, selectedColor);
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>♟️ Chess Trainer</h1>
        <p className="tagline">Master chess with AI opponents and premium training</p>
      </div>

      <div className="home-content">
        <section className="bot-selection">
          <h2>Choose Your Opponent</h2>
          <div className="bot-grid">
            {BOT_LEVELS.map((bot) => (
              <div
                key={bot.id}
                className={`bot-card ${selectedBot === bot.id ? 'selected' : ''} ${bot.isPremium ? 'premium' : ''}`}
                onClick={() => !bot.isPremium && setSelectedBot(bot.id)}
                style={{ cursor: bot.isPremium ? 'not-allowed' : 'pointer' }}
              >
                {bot.isPremium && (
                  <span className="premium-badge">Premium</span>
                )}
                <h3>{bot.name}</h3>
                <div className="elo-rating">ELO: {bot.elo}</div>
                <p className="bot-description">{bot.description}</p>
              </div>
            ))}
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
    </div>
  );
}

export default HomeScreen;
