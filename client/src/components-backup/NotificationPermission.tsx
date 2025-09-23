import React, { useState, useEffect } from 'react';
import { notificationService } from '../utils/notificationService';

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if we should show the permission prompt
    const shouldShowPrompt = () => {
      // Don't show if already granted or denied
      if (notificationService.isNotificationEnabled()) {
        setPermissionStatus('granted');
        return false;
      }

      // Don't show if user has already denied
      if (Notification.permission === 'denied') {
        setPermissionStatus('denied');
        return false;
      }

      // Show if user hasn't been asked yet and has been using the app
      const hasSeenPrompt = localStorage.getItem('notification_prompt_seen');
      const userEngagement = localStorage.getItem('user_engagement_score');
      
      return !hasSeenPrompt && (userEngagement ? parseInt(userEngagement) > 3 : false);
    };

    if (shouldShowPrompt()) {
      setShowPrompt(true);
    }

    setPermissionStatus(Notification.permission);
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        setPermissionStatus('granted');
        setShowPrompt(false);
        localStorage.setItem('notification_prompt_seen', 'true');
        onPermissionGranted?.();
        
        // Send welcome notification
        await notificationService.sendNotification({
          title: '🎉 Notifications Enabled!',
          body: 'You\'ll now receive learning reminders, course updates, and achievement notifications!',
          tag: 'welcome-notification'
        });
      } else {
        setPermissionStatus('denied');
        setShowPrompt(false);
        localStorage.setItem('notification_prompt_seen', 'true');
        onPermissionDenied?.();
      }
    } catch (error) {
      setPermissionStatus('denied');
      setShowPrompt(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_seen', 'true');
  };

  if (!showPrompt || permissionStatus === 'granted') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">🔔</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Stay Updated!
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Get learning reminders, course updates, and achievement notifications to keep your momentum going.
            </p>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRequesting ? 'Enabling...' : 'Enable Notifications'}
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-gray-500 text-xs px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;
