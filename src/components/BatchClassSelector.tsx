import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Batch {
  id: string;
  class_name: string;
  batch_number: number;
  start_date: string;
  status: string;
}

interface BatchClass {
  class_name: string;
  start_day_of_week: number;
  total_sessions: number;
  is_active: boolean;
}

const BatchClassSelector: React.FC = () => {
  const { user } = useAuth();
  const [batchClasses, setBatchClasses] = useState<BatchClass[]>([]);
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBatchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAvailableBatches(selectedClass);
    }
  }, [selectedClass]);

  const fetchBatchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('batch_classes')
        .select('*')
        .eq('is_active', true)
        .order('start_day_of_week');

      if (error) throw error;
      setBatchClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].class_name);
      }
    } catch (err: any) {
      console.error('Error fetching batch classes:', err);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBatches = async (className: string) => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('class_name', className)
        .eq('status', 'active')
        .order('batch_number', { ascending: false });

      if (error) throw error;
      setAvailableBatches(data || []);
    } catch (err: any) {
      console.error('Error fetching batches:', err);
      setError('Failed to load batches');
    }
  };

  const enrollInBatch = async (batchId: string) => {
    if (!user) {
      setError('Please sign in to enroll');
      return;
    }

    try {
      setEnrolling(batchId);
      setError('');
      setSuccess('');

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/batches/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ batch_id: batchId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to enroll');
      }

      setSuccess('Successfully enrolled in batch!');
      // Refresh batches to show enrollment status
      if (selectedClass) {
        fetchAvailableBatches(selectedClass);
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setError(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Classes</h1>
        <p className="text-gray-600">Select a class and enroll in an available batch</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Class Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {batchClasses.map((bc) => (
            <option key={bc.class_name} value={bc.class_name}>
              {bc.class_name} ({getDayName(bc.start_day_of_week)})
            </option>
          ))}
        </select>
      </div>

      {/* Available Batches */}
      {selectedClass && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Batches</h2>
          {availableBatches.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No active batches available for this class yet.</p>
              <p className="text-sm text-gray-500 mt-2">New batches start weekly on {getDayName(batchClasses.find(bc => bc.class_name === selectedClass)?.start_day_of_week || 0)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Batch {batch.batch_number}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Started: {new Date(batch.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => enrollInBatch(batch.id)}
                    disabled={enrolling === batch.id}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling === batch.id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchClassSelector;
