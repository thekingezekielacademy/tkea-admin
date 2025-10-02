'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { createClient } from '@/lib/supabase/client';
import TrialManager, { getTrialStatusStatic } from '@/utils/trialManager';

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
  const [trialStatus, setTrialStatus] = useState<any>(null);

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
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        const hasDatabaseSubscription = !subscriptionError && subscriptionData && subscriptionData.length > 0;
        console.log('📊 Database subscription status:', hasDatabaseSubscription);

        // PRIORITY 2: Check secure storage subscription
        const isSubActive = localStorage.getItem('subscription_active') === 'true';
        console.log('📊 Secure storage subscription status:', isSubActive);

        // If user has either type of subscription, grant access immediately
        if (hasDatabaseSubscription || isSubActive) {
          console.log('✅ ACCESS GRANTED - Active subscription found (DB or secure storage)');
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // PRIORITY 3: Only check trial status if no subscription found
        console.log('📅 No subscription found, checking trial status...');
        let updatedTrialStatus = null;
        
        try {
          // Debug: Check what TrialManager actually is
          console.log('🔍 TrialManager object:', TrialManager);
          console.log('🔍 TrialManager.getTrialStatusStatic:', typeof TrialManager.getTrialStatusStatic);
          
          if (typeof TrialManager.getTrialStatusStatic === 'function') {
            updatedTrialStatus = await TrialManager.getTrialStatusStatic(user.id);
            console.log('📅 Trial status check result:', updatedTrialStatus);
          } else if (typeof getTrialStatusStatic === 'function') {
            console.log('⚠️ TrialManager.getTrialStatusStatic is not a function, trying individual export');
            updatedTrialStatus = await getTrialStatusStatic(user.id);
            console.log('📅 Trial status check result (individual export):', updatedTrialStatus);
          } else {
            console.log('⚠️ Both static methods failed, trying instance method');
            // Fallback to instance method
            const trialManager = new TrialManager();
            updatedTrialStatus = await trialManager.getTrialStatus();
            console.log('📅 Trial status check result (instance):', updatedTrialStatus);
          }
        } catch (trialError) {
          console.log('⚠️ Trial status check failed:', trialError);
          // Don't fail completely if trial check fails
        }

        if (updatedTrialStatus) {
          setTrialStatus(updatedTrialStatus);
          console.log('📊 Trial status updated:', updatedTrialStatus);

          // Check if trial is still active
          const trialActive = updatedTrialStatus.isActive && updatedTrialStatus.daysRemaining > 0;
          console.log('🔐 Trial access:', trialActive, '(Active:', updatedTrialStatus.isActive, '| Days remaining:', updatedTrialStatus.daysRemaining, ')');

          setHasAccess(trialActive);

          // Redirect if NO access (trial expired)
          if (!trialActive) {
            console.log('🚫 ACCESS DENIED - Trial expired and no subscription - redirecting to profile');
            router.push('/profile', { replace: true });
            return;
          } else {
            console.log('✅ ACCESS GRANTED - Trial active');
          }
        } else {
          console.log('⚠️ No trial data found and no subscription - redirecting to profile');
          setHasAccess(false);
          router.push('/profile', { replace: true });
          return;
        }
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
            router.push('/profile', { replace: true });
          }
        } catch (fallbackError) {
          console.error('❌ Fallback check failed:', fallbackError);
          setHasAccess(false);
          router.push('/profile', { replace: true });
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
