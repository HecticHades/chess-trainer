import { useState } from 'react';
import './SubscriptionModal.css';

interface SubscriptionModalProps {
  isOpen: boolean;
  reason: 'premium_bot' | 'game_limit';
  onClose: () => void;
  onUnlock: () => void;
}

function SubscriptionModal({ isOpen, reason, onClose, onUnlock }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  if (!isOpen) return null;

  const getMessage = () => {
    if (reason === 'premium_bot') {
      return {
        title: 'Premium Bot Required',
        description: 'Advanced, Expert, and Master bots are only available with Premium.',
      };
    } else {
      return {
        title: 'Daily Game Limit Reached',
        description: "You've played 5 games today. Upgrade to Premium for unlimited games!",
      };
    }
  };

  const message = getMessage();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>

        <div className="modal-header">
          <h2>♔ Premium Chess Trainer</h2>
          <p className="subtitle">{message.title}</p>
          <p className="description">{message.description}</p>
        </div>

        <div className="pricing-toggle">
          <button
            className={`toggle-btn ${selectedPlan === 'monthly' ? 'active' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            Monthly
          </button>
          <button
            className={`toggle-btn ${selectedPlan === 'yearly' ? 'active' : ''}`}
            onClick={() => setSelectedPlan('yearly')}
          >
            Yearly
            <span className="save-badge">Save 33%</span>
          </button>
        </div>

        <div className="pricing-cards">
          {selectedPlan === 'monthly' ? (
            <div className="pricing-card">
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">4.99</span>
                <span className="period">/month</span>
              </div>
              <p className="billing">Billed monthly</p>
            </div>
          ) : (
            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">39.99</span>
                <span className="period">/year</span>
              </div>
              <p className="billing">Just $3.33/month • Save $20/year</p>
            </div>
          )}
        </div>

        <div className="features-list">
          <div className="feature">
            <span className="checkmark">✓</span>
            <span>Unlimited games every day</span>
          </div>
          <div className="feature">
            <span className="checkmark">✓</span>
            <span>All 5 bot difficulty levels (800-2400 ELO)</span>
          </div>
          <div className="feature">
            <span className="checkmark">✓</span>
            <span>Advanced, Expert, and Master bots</span>
          </div>
          <div className="feature">
            <span className="checkmark">✓</span>
            <span>Future: Tactics, Openings & Endgame trainers</span>
          </div>
          <div className="feature">
            <span className="checkmark">✓</span>
            <span>Future: Game analysis and statistics</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary btn-large" onClick={onUnlock}>
            Unlock Premium (Demo)
          </button>
          <p className="demo-note">
            This is a demo. Click above to unlock all features for free!
          </p>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;
