import React, { useState } from 'react';
import { notificationService } from '../utils/notificationService';

const NotificationTest: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  const checkPermission = () => {
    setPermissionStatus(Notification.permission);
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        console.log('✅ Permission granted, initializing notifications...');
        notificationService.forceReinitialize();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const testNotification = async () => {
    if (permissionStatus === 'granted') {
      await notificationService.sendNotification({
        title: '🔔 Test Notification',
        body: 'This is a test notification from King Ezekiel Academy!',
        icon: '/favicon.svg',
        tag: 'test-notification'
      });
    }
  };

  const testDailyReminder = async () => {
    if (permissionStatus === 'granted') {
      await notificationService.sendDailyLearningReminder();
    }
  };

  const testStreakReminder = async () => {
    if (permissionStatus === 'granted') {
      await notificationService.sendStreakReminder(5);
    }
  };

  const reinitializeNotifications = () => {
    notificationService.forceReinitialize();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Notification Test</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Permission Status: <span className={`font-semibold ${permissionStatus === 'granted' ? 'text-green-600' : permissionStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'}`}>
            {permissionStatus}
          </span></p>
        </div>

        <div className="space-y-2">
          <button
            onClick={checkPermission}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Check Permission
          </button>

          {permissionStatus !== 'granted' && (
            <button
              onClick={requestPermission}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Request Permission
            </button>
          )}

          <button
            onClick={reinitializeNotifications}
            className="w-full bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
          >
            Re-initialize Notifications
          </button>

          {permissionStatus === 'granted' && (
            <>
              <button
                onClick={testNotification}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
              >
                Test Basic Notification
              </button>

              <button
                onClick={testDailyReminder}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
              >
                Test Daily Reminder
              </button>

              <button
                onClick={testStreakReminder}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Test Streak Reminder
              </button>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p><strong>Notification Schedule:</strong></p>
          <p>• Weekdays: 6 PM (Daily), 8 PM (Streak), 7 PM (Course)</p>
          <p>• Weekends: 2 PM (Daily), 3 PM (Streak), 4 PM (Course)</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
