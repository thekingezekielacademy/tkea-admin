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
    console.log('🧪 Testing basic notification...');
    console.log('🔍 Permission status:', permissionStatus);
    console.log('🔍 Notification supported:', 'Notification' in window);
    console.log('🔍 Current permission:', Notification.permission);
    
    if (permissionStatus === 'granted') {
      try {
        console.log('🚀 Attempting to send notification...');
        await notificationService.sendNotification({
          title: '🔔 Test Notification',
          body: 'This is a test notification from King Ezekiel Academy!',
          icon: '/favicon.svg',
          tag: 'test-notification'
        });
        console.log('✅ Notification sent successfully!');
      } catch (error) {
        console.error('❌ Error sending notification:', error);
      }
    } else {
      console.log('❌ Permission not granted');
    }
  };

  const testDailyReminder = async () => {
    console.log('🧪 Testing daily reminder...');
    if (permissionStatus === 'granted') {
      try {
        await notificationService.sendDailyLearningReminder();
        console.log('✅ Daily reminder sent!');
      } catch (error) {
        console.error('❌ Error sending daily reminder:', error);
      }
    }
  };

  const testStreakReminder = async () => {
    console.log('🧪 Testing streak reminder...');
    if (permissionStatus === 'granted') {
      try {
        await notificationService.sendStreakReminder(5);
        console.log('✅ Streak reminder sent!');
      } catch (error) {
        console.error('❌ Error sending streak reminder:', error);
      }
    }
  };

  const reinitializeNotifications = () => {
    notificationService.forceReinitialize();
  };

  const testDirectNotification = () => {
    console.log('🧪 Testing direct notification (bypassing service worker)...');
    if (permissionStatus === 'granted') {
      try {
        const notification = new Notification('🔔 Direct Test', {
          body: 'This is a direct notification test!',
          icon: '/favicon.svg',
          tag: 'direct-test'
        });
        console.log('✅ Direct notification created!');
        
        notification.onclick = () => {
          console.log('📱 Notification clicked!');
          notification.close();
        };
      } catch (error) {
        console.error('❌ Error creating direct notification:', error);
      }
    } else {
      console.log('❌ Permission not granted for direct notification');
    }
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

              <button
                onClick={testDirectNotification}
                className="w-full bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
              >
                Test Direct Notification
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
