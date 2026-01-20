import React from 'react';
import ReplayButton from './ReplayButton';

interface BatchClassSession {
  id: string;
  class_name: string;
  session_number: number;
  session_title: string;
  session_type: 'morning' | 'afternoon' | 'evening';
  scheduled_date: string;
  scheduled_time: string;
  scheduled_datetime: string;
  status: string;
}

interface BatchClassSessionCardProps {
  session: BatchClassSession;
  batchNumber: number;
  hasAccess?: boolean;
  accessLevel?: 'full_access' | 'limited_access';
}

const BatchClassSessionCard: React.FC<BatchClassSessionCardProps> = ({
  session,
  batchNumber,
  hasAccess = false,
  accessLevel = 'limited_access'
}) => {
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSessionTypeIcon = (type: string): string => {
    switch (type) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌙';
      default:
        return '📚';
    }
  };

  const getSessionTypeLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const isPast = new Date(session.scheduled_datetime) < new Date();
  const isFree = session.session_number <= 2;
  const requiresFullAccess = session.session_number > 2;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getSessionTypeIcon(session.session_type)}</span>
            <span className="text-sm font-medium text-gray-600">
              {getSessionTypeLabel(session.session_type)} Session
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Class {session.session_number}: {session.session_title}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(session.scheduled_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatTime(session.scheduled_time)}
          </p>
        </div>
        <div className="ml-4">
          {isFree ? (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
              FREE
            </span>
          ) : requiresFullAccess ? (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
              PREMIUM
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Batch {batchNumber}
        </div>
        <ReplayButton
          sessionId={session.id}
          sessionNumber={session.session_number}
          isPast={isPast}
          hasAccess={hasAccess}
          accessLevel={accessLevel}
        />
      </div>
    </div>
  );
};

export default BatchClassSessionCard;
