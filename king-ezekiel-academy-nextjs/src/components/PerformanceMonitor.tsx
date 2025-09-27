'use client'
import React, { useEffect, useState } from 'react';
// import { performanceMonitor } from '@/lib/supabase-optimized';

interface PerformanceStats {
  averageQueryTime: number;
  slowQueries: string[];
  cacheHitRate: number;
  totalQueries: number;
}

const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    averageQueryTime: 0,
    slowQueries: [],
    cacheHitRate: 0,
    totalQueries: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      // Mock performance data since performanceMonitor was removed
      const averageQueryTime = Math.random() * 100; // Random value between 0-100ms
      const cacheHitRate = 0.85; // 85% cache hit rate
      const totalQueries = Math.floor(Math.random() * 50) + 10; // Random between 10-60 queries
      const slowQueries: string[] = [];

      // Occasionally add a slow query for demo purposes
      if (Math.random() > 0.8) {
        slowQueries.push(`Demo Query: ${(Math.random() * 2000 + 1000).toFixed(0)}ms`);
      }

      setStats({
        averageQueryTime,
        slowQueries,
        cacheHitRate,
        totalQueries
      });
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Performance Monitor"
      >
        📊
      </button>

      {/* Performance panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Query Time:</span>
              <span className={`font-medium ${
                stats.averageQueryTime > 1000 ? 'text-red-600' : 
                stats.averageQueryTime > 500 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {stats.averageQueryTime.toFixed(0)}ms
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Total Queries:</span>
              <span className="font-medium text-gray-900">{stats.totalQueries}</span>
            </div>

            {stats.slowQueries.length > 0 && (
              <div>
                <span className="text-gray-600 text-xs">Slow Queries:</span>
                <div className="mt-1 space-y-1">
                  {stats.slowQueries.map((query, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      {query}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setStats(prev => ({ ...prev, totalQueries: 0, slowQueries: [], averageQueryTime: 0 }));
                }}
                className="w-full text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
              >
                Clear Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor;
