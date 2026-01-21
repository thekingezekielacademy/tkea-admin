import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface BatchClass {
  id: string;
  class_name: string;
  start_day_of_week: number;
  is_active: boolean;
}

interface Batch {
  id: string;
  class_name: string;
  batch_number: number;
  start_date: string;
  status: string;
}

interface Session {
  id: string;
  batch_id: string;
  session_number: number;
  session_date: string;
  session_type: string;
  scheduled_datetime: string;
}

const BatchClassesStatus: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kicking, setKicking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError('');

      // Use centralized Supabase client from lib/supabase.ts

      // Get batch classes
      const { data: batchClasses, error: batchClassesError } = await supabase
        .from('batch_classes')
        .select('*')
        .eq('is_active', true);

      if (batchClassesError) {
        console.error('Error fetching batch classes:', batchClassesError);
        // Don't throw - continue with empty array
      }

      // Get active batches
      const { data: batches, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false });

      if (batchesError) {
        console.error('Error fetching batches:', batchesError);
        // Don't throw - continue with empty array
      }

      // Get today's sessions
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySessions, error: todaySessionsError } = await supabase
        .from('batch_class_sessions')
        .select('*')
        .eq('session_date', today)
        .order('scheduled_datetime', { ascending: true });

      if (todaySessionsError) {
        console.error('Error fetching today sessions:', todaySessionsError);
        // Don't throw - continue with empty array
      }

      // Get upcoming sessions (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: upcomingSessions, error: upcomingSessionsError } = await supabase
        .from('batch_class_sessions')
        .select('*')
        .gte('session_date', today)
        .lte('session_date', nextWeek.toISOString().split('T')[0])
        .order('scheduled_datetime', { ascending: true })
        .limit(20);

      if (upcomingSessionsError) {
        console.error('Error fetching upcoming sessions:', upcomingSessionsError);
        // Don't throw - continue with empty array
      }

      // Check if any critical errors occurred
      const errors = [
        batchClassesError,
        batchesError,
        todaySessionsError,
        upcomingSessionsError
      ].filter(Boolean);

      if (errors.length > 0) {
        const errorMessages = errors.map(e => e?.message || 'Unknown error').join(', ');
        const firstError = errors[0];
        
        // If it's a "relation does not exist" error, provide helpful message
        if (firstError?.message?.includes('relation') || firstError?.message?.includes('does not exist')) {
          setError('⚠️ Database tables not found. Please run the batch class migrations in Supabase first.');
        } else {
          setError(`⚠️ Some data could not be loaded: ${errorMessages}. The page will still work with available data.`);
        }
      }

      setStatus({
        batchClasses: batchClasses || [],
        batches: batches || [],
        todaySessions: todaySessions || [],
        upcomingSessions: upcomingSessions || []
      });
    } catch (err: any) {
      console.error('Error fetching status:', err);
      setError(err.message || 'Failed to fetch status. Please check your connection and try again.');
      setStatus({
        batchClasses: [],
        batches: [],
        todaySessions: [],
        upcomingSessions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKickstart = async () => {
    try {
      setKicking(true);
      setError('');

      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/batch-classes/kickstart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        alert('✅ System kickstarted successfully!');
        await fetchStatus();
      } else {
        setError(result.message || 'Kickstart failed');
      }
    } catch (err: any) {
      console.error('Kickstart error:', err);
      setError(err.message || 'Failed to kickstart system. Please check the console for details.');
    } finally {
      setKicking(false);
    }
  };

  const handleGenerateSessions = async () => {
    try {
      setGenerating(true);
      setError('');

      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/cron/generate-batch-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'x-vercel-cron': '1'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        alert('✅ Sessions generated successfully!');
        await fetchStatus();
      } else {
        setError(result.message || 'Session generation failed');
      }
    } catch (err: any) {
      console.error('Generate sessions error:', err);
      setError(err.message || 'Failed to generate sessions. Please check the console for details.');
    } finally {
      setGenerating(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Batch Class System Status</h1>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <div className="font-semibold mb-1">⚠️ Notice</div>
              <div>{error}</div>
              {error.includes('migrations') && (
                <div className="mt-2 text-sm">
                  <p>To fix this, run these SQL migrations in Supabase:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li><code>supabase/migrations/20250117_001_create_batch_class_system.sql</code></li>
                    <li><code>supabase/migrations/20250117_002_setup_batch_class_live_classes.sql</code></li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleKickstart}
              disabled={kicking}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {kicking ? '⏳ Kickstarting...' : '🚀 Kickstart System'}
            </button>
            <button
              onClick={handleGenerateSessions}
              disabled={generating}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? '⏳ Generating...' : '📅 Generate Today\'s Sessions'}
            </button>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{status?.batchClasses?.length || 0}</div>
              <div className="text-sm text-gray-600">Batch Classes Configured</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{status?.batches?.length || 0}</div>
              <div className="text-sm text-gray-600">Active Batches</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{status?.todaySessions?.length || 0}</div>
              <div className="text-sm text-gray-600">Sessions Today</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{status?.upcomingSessions?.length || 0}</div>
              <div className="text-sm text-gray-600">Upcoming Sessions (7 days)</div>
            </div>
          </div>

          {/* Batch Classes */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Batch Classes</h2>
            <div className="space-y-2">
              {status?.batchClasses && status.batchClasses.length > 0 ? (
                status.batchClasses.map((bc: BatchClass) => (
                  <div key={bc.id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{bc.class_name}</div>
                      <div className="text-sm text-gray-600">Starts: {getDayName(bc.start_day_of_week)}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${bc.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {bc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No batch classes found. Please run the database migrations first.</p>
              )}
            </div>
          </div>

          {/* Active Batches */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Active Batches</h2>
            <div className="space-y-2">
              {status?.batches && status.batches.length > 0 ? (
                status.batches.map((batch: Batch) => (
                  <div key={batch.id} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">{batch.class_name}</div>
                    <div className="text-sm text-gray-600">Batch #{batch.batch_number} - Started: {new Date(batch.start_date).toLocaleDateString()}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No active batches found. Click "Kickstart System" to create batches.</p>
              )}
            </div>
          </div>

          {/* Today's Sessions */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Today's Sessions</h2>
            <div className="space-y-2">
              {status?.todaySessions && status.todaySessions.length > 0 ? (
                status.todaySessions.map((session: Session) => (
                  <div key={session.id} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">{session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} Session</div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.scheduled_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No sessions scheduled for today. Click "Generate Today's Sessions" to create them.</p>
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Sessions (Next 7 Days)</h2>
            <div className="space-y-2">
              {status?.upcomingSessions && status.upcomingSessions.length > 0 ? (
                status.upcomingSessions.map((session: Session) => (
                  <div key={session.id} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">{session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} Session</div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.scheduled_datetime).toLocaleDateString()} at{' '}
                      {new Date(session.scheduled_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No upcoming sessions found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchClassesStatus;
