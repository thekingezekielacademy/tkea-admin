'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { createClient } from '@/lib/supabase/client';

interface AccessControlProps {
  children: React.ReactNode;
  requireAccess?: boolean;
}

const AccessControl: React.FC<AccessControlProps> = ({ children, requireAccess = true }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id || !requireAccess) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      try {
        // Extract courseId from URL parameters when in lesson route
        let courseId = null;
        const pathParts = pathname.split('/');
        if (pathParts.includes('course') && pathParts.includes('lesson')) {
          const courseIndex = pathParts.indexOf('course');
          if (courseIndex >= 0 && courseIndex + 1 < pathParts.length) {
            courseId = pathParts[courseIndex + 1];
          }
        } else if (params.courseId) {
          courseId = params.courseId as string;
        }

        // First, check if this is a free course - if so, grant access immediately
        if (courseId) {
          const supabase = createClient();
          const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('access_type')
            .eq('id', courseId)
            .single();

          if (!courseError && courseData?.access_type === 'free') {
            console.log('✅ FREE COURSE ACCESS GRANTED - Course is marked as free');
            setHasAccess(true);
            setLoading(false);
            return;
          }
        }

        // PRIORITY 1: Check database subscription status first (most reliable)
        const supabase = createClient();
        
        // First try with is_active column (if it exists)
        let { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        // If is_active column doesn't exist, fallback to status-only check
        if (subscriptionError && subscriptionError.message?.includes('is_active')) {
          console.log('⚠️ is_active column not found, falling back to status-only check');
          const fallbackResult = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);
          
          subscriptionData = fallbackResult.data;
          subscriptionError = fallbackResult.error;
        }

        // Improved access check: Only grant access if subscription's end_date/next_payment_date is in the future
        let userSub = null;
        if (subscriptionData && subscriptionData.length > 0) {
          userSub = subscriptionData[0];
        }

        let isValid = false;
        const now = new Date();
        if (userSub) {
          // Prefer end_date (or next_payment_date) and ensure it's in the future
          if (userSub.end_date && new Date(userSub.end_date) > now) {
            isValid = true;
          } else if (userSub.next_payment_date && new Date(userSub.next_payment_date) > now) {
            isValid = true;
          }
        }

        if (isValid) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // DEBUG: Log localStorage status, but do NOT use for granting access
        const isSubActive = localStorage.getItem('subscription_active') === 'true';
        console.log('[AccessControl] DB subscription valid:', isValid, 'LocalStorage flag:', isSubActive);

        // No valid subscription found - deny access and redirect
        setHasAccess(false);
        setLoading(false);
        router.push('/profile');
        return;
      } catch (error) {
        console.error('❌ Error checking access:', error);
        
        // If there's an error, check if user has subscription as fallback
        try {
          const isSubActive = localStorage.getItem('subscription_active') === 'true';
          if (isSubActive) {
            console.log('✅ FALLBACK: Granting access based on secure storage subscription');
            setHasAccess(true);
          } else {
            console.log('🚫 FALLBACK: No subscription found, redirecting to profile');
            setHasAccess(false);
            router.push('/profile');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback check failed:', fallbackError);
          setHasAccess(false);
          router.push('/profile');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user?.id, router, requireAccess, pathname, params]);

  // Show loading state while checking access
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // If no access, don't render children (will redirect)
  if (!hasAccess) {
    return null;
  }

  // If access granted, render children
  return <>{children}</>;
};

export default AccessControl;
