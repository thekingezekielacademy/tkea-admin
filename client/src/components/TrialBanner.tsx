import React from 'react';
import { FaExclamationTriangle, FaClock, FaCrown } from 'react-icons/fa';
import { TrialStatus } from '../utils/trialManager';

interface TrialBannerProps {
  trialStatus: TrialStatus;
  onSubscribe: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ trialStatus, onSubscribe }) => {
  if (!trialStatus.isActive || trialStatus.isExpired) {
    return null;
  }

  const getBannerStyle = () => {
    if (trialStatus.daysRemaining === 0) {
      return 'bg-red-500 text-white';
    } else if (trialStatus.daysRemaining <= 2) {
      return 'bg-orange-500 text-white';
    } else {
      return 'bg-blue-500 text-white';
    }
  };

  const getIcon = () => {
    if (trialStatus.daysRemaining === 0) {
      return <FaExclamationTriangle className="text-red-200" />;
    } else if (trialStatus.daysRemaining <= 2) {
      return <FaClock className="text-orange-200" />;
    } else {
      return <FaCrown className="text-blue-200" />;
    }
  };

  const getMessage = () => {
    if (trialStatus.daysRemaining === 0) {
      return 'Your free trial expires today! Subscribe now to keep learning.';
    } else if (trialStatus.daysRemaining === 1) {
      return 'Your free trial expires tomorrow! Subscribe now to keep learning.';
    } else if (trialStatus.daysRemaining <= 3) {
      return `Your free trial expires in ${trialStatus.daysRemaining} days. Subscribe now to keep learning!`;
    } else {
      return `You have ${trialStatus.daysRemaining} days left in your ${trialStatus.totalDays}-day free trial.`;
    }
  };

  return (
    <div className={`${getBannerStyle()} p-4 rounded-lg shadow-lg mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div>
            <p className="font-semibold text-lg">{getMessage()}</p>
            <p className="text-sm opacity-90">
              {trialStatus.daysRemaining > 0 
                ? `Trial ends: ${new Date(trialStatus.endDate).toLocaleDateString()}`
                : 'Trial ended today'
              }
            </p>
          </div>
        </div>
        <button
          onClick={onSubscribe}
          className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Subscribe Now
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;
