import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkCourseAccess, getGuestEmail } from '../utils/courseAccess';
import { supabase } from '../lib/supabase';

interface UseCourseAccessResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  checkAccess: () => Promise<void>;
}

/**
 * Hook to check if user has access to a course
 * Supports both authenticated users and guest users (by email)
 */
export function useCourseAccess(courseId: string): UseCourseAccessResult {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user email (from auth or guest storage)
      const userEmail = user?.email || getGuestEmail();

      // Check access
      const access = await checkCourseAccess(
        courseId,
        user?.id || null,
        userEmail || null
      );

      setHasAccess(access);
    } catch (err: any) {
      setError(err.message || 'Failed to check access');
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id, user?.email]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    loading,
    error,
    checkAccess,
  };
}
