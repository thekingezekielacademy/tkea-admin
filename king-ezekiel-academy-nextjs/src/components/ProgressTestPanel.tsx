'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressTestUtils } from '@/utils/progressTestUtils';

interface ProgressTestPanelProps {
  className?: string;
}

export default function ProgressTestPanel({ className = '' }: ProgressTestPanelProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [message, setMessage] = useState<string>('');

  const handleTestProgressUpdate = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await ProgressTestUtils.testProgressUpdate(user.id);
      setMessage(result ? '✅ Progress update test successful!' : '❌ Progress update test failed!');
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDebugInfo = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const info = await ProgressTestUtils.getProgressDebugInfo(user.id);
      setDebugInfo(info);
      setMessage('📊 Debug info retrieved! Check console for details.');
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearProgress = async () => {
    if (!user?.id) return;
    
    const confirmed = window.confirm('⚠️ Are you sure you want to clear all progress data? This cannot be undone!');
    if (!confirmed) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await ProgressTestUtils.clearProgressData(user.id);
      setMessage(result ? '✅ Progress data cleared!' : '❌ Failed to clear progress data!');
      setDebugInfo(null);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.id) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <p className="text-yellow-700">Please log in to test progress tracking.</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Progress Tracking Test Panel
      </h3>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleTestProgressUpdate}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Progress Update'}
          </button>
          
          <button
            onClick={handleGetDebugInfo}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Get Debug Info'}
          </button>
          
          <button
            onClick={handleClearProgress}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Clearing...' : 'Clear All Progress'}
          </button>
        </div>

        {message && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">{message}</p>
          </div>
        )}

        {debugInfo && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Debug Info:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Lesson Progress:</strong> {debugInfo.lessonProgress.count} lessons
              </div>
              <div>
                <strong>Course Progress:</strong> {debugInfo.courseProgress.count} courses
              </div>
              <div>
                <strong>Profile XP:</strong> {debugInfo.profile.data?.xp || 0}
              </div>
              <div>
                <strong>Current Streak:</strong> {debugInfo.profile.data?.current_streak || 0} days
              </div>
              
              {debugInfo.databaseStructure && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2">Database Structure:</h5>
                  <div className="space-y-1 text-xs">
                    <div>
                      <strong>Lessons Table:</strong> {debugInfo.databaseStructure.lessons.count} records
                    </div>
                    <div>
                      <strong>Course Videos Table:</strong> {debugInfo.databaseStructure.courseVideos.count} records
                    </div>
                  </div>
                  
                  {debugInfo.lessonProgress.data && debugInfo.lessonProgress.data.length > 0 && (
                    <div className="mt-2">
                      <h6 className="font-medium text-gray-700">Lesson Progress Data:</h6>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(debugInfo.lessonProgress.data.slice(0, 3), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
