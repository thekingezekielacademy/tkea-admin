import React, { useState, useEffect } from 'react';
import { FaBell, FaBellSlash, FaTimes } from 'react-icons/fa';

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      return;
    }

    // Check if user has previously denied permission
    const permissionDenied = localStorage.getItem('notification_permission_denied');
    if (permissionDenied) {
      return;
    }

    // Show banner after a delay
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      return;
    }

    setIsRequesting(true);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setShowBanner(false);
        localStorage.setItem('notification_permission_granted', 'true');
        onPermissionGranted?.();
      } else {
        localStorage.setItem('notification_permission_denied', 'true');
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      localStorage.setItem('notification_permission_denied', 'true');
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('notification_permission_denied', 'true');
    onPermissionDenied?.();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <FaBell className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Enable Notifications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Get notified about your learning progress, achievements, and course updates.
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={requestPermission}
                disabled={isRequesting}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Requesting...' : 'Enable'}
              </button>
              <button
                onClick={dismissBanner}
                className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;
