import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import { BotDifficulty } from './types/chess';
import './App.css';

type Screen = 'home' | 'game' | 'training' | 'settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedBot, setSelectedBot] = useState<BotDifficulty>('beginner');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');

  const startGame = (bot: BotDifficulty, color: 'white' | 'black') => {
    setSelectedBot(bot);
    setPlayerColor(color);
    setCurrentScreen('game');
  };

  const goHome = () => {
    setCurrentScreen('home');
  };

  return (
    <div className="app">
      {currentScreen === 'home' && (
        <HomeScreen onStartGame={startGame} />
      )}
      {currentScreen === 'game' && (
        <GameScreen
          botDifficulty={selectedBot}
          playerColor={playerColor}
          onExit={goHome}
        />
      )}
    </div>
  );
}

export default App;
