import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import AccessRestrictedPopup from './AccessRestrictedPopup';

interface ReplayButtonProps {
  sessionId: string;
  sessionNumber: number;
  isPast: boolean;
  hasAccess: boolean;
  accessLevel: 'full_access' | 'limited_access';
}

const ReplayButton: React.FC<ReplayButtonProps> = ({
  sessionId,
  sessionNumber,
  isPast,
  hasAccess,
  accessLevel
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const isFree = sessionNumber <= 2;
  const requiresFullAccess = sessionNumber > 2;
  const canReplay = isFree || (requiresFullAccess && accessLevel === 'full_access');

  const handleReplayClick = async () => {
    if (!isPast) {
      return; // Can't replay future sessions
    }

    if (canReplay) {
      // User has access, proceed to replay
      window.location.href = `/batch-sessions/${sessionId}`;
      return;
    }

    // Check access via API
    setCheckingAccess(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setShowPopup(true);
        return;
      }

      const response = await fetch(`/api/batch-sessions/${sessionId}/replay`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success && result.hasAccess) {
        // User has access, proceed to replay
        window.location.href = `/batch-sessions/${sessionId}`;
      } else {
        // Show popup for restricted access
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setShowPopup(true);
    } finally {
      setCheckingAccess(false);
    }
  };

  if (!isPast) {
    return (
      <div className="text-sm text-gray-500">
        Upcoming
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleReplayClick}
        disabled={checkingAccess}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          canReplay
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {checkingAccess ? 'Checking...' : 'Watch Replay'}
      </button>

      {showPopup && (
        <AccessRestrictedPopup
          sessionNumber={sessionNumber}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

export default ReplayButton;
