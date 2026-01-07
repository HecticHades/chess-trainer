import './GameResultModal.css';

interface GameResultModalProps {
  isOpen: boolean;
  result: 'win' | 'loss' | 'draw';
  reason: string;
  onNewGame: () => void;
  onExit: () => void;
}

function GameResultModal({ isOpen, result, reason, onNewGame, onExit }: GameResultModalProps) {
  if (!isOpen) return null;

  const getResultInfo = () => {
    switch (result) {
      case 'win':
        return {
          title: 'Victory!',
          emoji: '🎉',
          className: 'result-win',
        };
      case 'loss':
        return {
          title: 'Defeat',
          emoji: '😔',
          className: 'result-loss',
        };
      case 'draw':
        return {
          title: 'Draw',
          emoji: '🤝',
          className: 'result-draw',
        };
    }
  };

  const info = getResultInfo();

  return (
    <div className="modal-overlay" onClick={onExit}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`result-header ${info.className}`}>
          <div className="result-emoji">{info.emoji}</div>
          <h2>{info.title}</h2>
          <p className="result-reason">{reason}</p>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onNewGame}>
            New Game
          </button>
          <button className="btn btn-outline" onClick={onExit}>
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameResultModal;
