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
        console.log('🔍 Notification object:', notification);
        
        notification.onclick = () => {
          console.log('📱 Notification clicked!');
          notification.close();
        };
        
        notification.onshow = () => {
          console.log('👁️ Notification is now visible!');
        };
        
        notification.onerror = (error) => {
          console.error('❌ Notification error:', error);
        };
        
        // Auto-close after 5 seconds for testing
        setTimeout(() => {
          console.log('⏰ Auto-closing notification after 5 seconds');
          notification.close();
        }, 5000);
        
      } catch (error) {
        console.error('❌ Error creating direct notification:', error);
      }
    } else {
      console.log('❌ Permission not granted for direct notification');
    }
  };

  // Course recommendation test functions
  const testPopularCourseRecommendation = async () => {
    console.log('🧪 Testing popular course recommendation...');
    if (permissionStatus === 'granted') {
      try {
        await notificationService.sendPopularCourseRecommendation(
          'AI TOOLS EXPLAINED - FOR BEGINNERS',
          'AI & Technology',
          2500
        );
        console.log('✅ Popular course recommendation sent!');
      } catch (error) {
        console.error('❌ Error sending popular course recommendation:', error);
      }
    } else {
      console.log('❌ Permission not granted');
    }
  };

  const testCategoryCourseRecommendation = async () => {
    console.log('🧪 Testing category course recommendation...');
    if (permissionStatus === 'granted') {
      try {
        await notificationService.sendCategoryCourseRecommendation(
          'DIGITAL MARKETING MASTERY',
          'Marketing'
        );
        console.log('✅ Category course recommendation sent!');
      } catch (error) {
        console.error('❌ Error sending category course recommendation:', error);
      }
    } else {
      console.log('❌ Permission not granted');
    }
  };

  const testTrendingCourseRecommendation = async () => {
    console.log('🧪 Testing trending course recommendation...');
    if (permissionStatus === 'granted') {
      try {
        await notificationService.sendTrendingCourseRecommendation(
          'WEB DEVELOPMENT FUNDAMENTALS',
          'Programming'
        );
        console.log('✅ Trending course recommendation sent!');
      } catch (error) {
        console.error('❌ Error sending trending course recommendation:', error);
      }
    } else {
      console.log('❌ Permission not granted');
    }
  };

  const testBeginnerCourseRecommendation = async () => {
    console.log('🧪 Testing beginner course recommendation...');
    if (permissionStatus === 'granted') {
      try {
        await notificationService.sendBeginnerCourseRecommendation(
          'CYBERSECURITY BASICS',
          'Security'
        );
        console.log('✅ Beginner course recommendation sent!');
      } catch (error) {
        console.error('❌ Error sending beginner course recommendation:', error);
      }
    } else {
      console.log('❌ Permission not granted');
    }
  };

  const testAdvancedCourseRecommendation = async () => {
    console.log('🧪 Testing advanced course recommendation...');
    if (permissionStatus === 'granted') {
      try {
        await notificationService.sendAdvancedCourseRecommendation(
          'DATA SCIENCE ESSENTIALS',
          'Data Science'
        );
        console.log('✅ Advanced course recommendation sent!');
      } catch (error) {
        console.error('❌ Error sending advanced course recommendation:', error);
      }
    } else {
      console.log('❌ Permission not granted');
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

        {/* Course Recommendation Tests */}
        {permissionStatus === 'granted' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Course Recommendation Tests</h3>
            <div className="space-y-2">
              <button
                onClick={testPopularCourseRecommendation}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
              >
                Test Popular Course Recommendation
              </button>
              <button
                onClick={testCategoryCourseRecommendation}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Test Category Course Recommendation
              </button>
              <button
                onClick={testTrendingCourseRecommendation}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
              >
                Test Trending Course Recommendation
              </button>
              <button
                onClick={testBeginnerCourseRecommendation}
                className="w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 transition-colors"
              >
                Test Beginner Course Recommendation
              </button>
              <button
                onClick={testAdvancedCourseRecommendation}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
              >
                Test Advanced Course Recommendation
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p><strong>Notification Schedule:</strong></p>
          <p>• Weekdays: 6 PM (Daily), 8 PM (Streak), 7 PM (Course), 8 PM (Recommendations)</p>
          <p>• Weekends: 2 PM (Daily), 3 PM (Streak), 4 PM (Course), 5 PM (Recommendations)</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
