'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { supabase } from '@/lib/supabase';
import TrialManager from '@/utils/trialManager';

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

        // Check database subscription status
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        const hasDatabaseSubscription = !subscriptionError && subscriptionData && subscriptionData.length > 0;

        // Check secure storage subscription
        const isSubActive = localStorage.getItem('subscription_active') === 'true';

        // Check trial status using the correct method
        let updatedTrialStatus = await TrialManager.getTrialStatusStatic(user.id);
        console.log('📅 Trial status check result:', updatedTrialStatus);

        if (updatedTrialStatus) {
          setTrialStatus(updatedTrialStatus);
          console.log('📊 Trial status updated:', updatedTrialStatus);

          // Check if access should be granted (prioritize database subscription)
          const accessGranted = updatedTrialStatus.isActive || hasDatabaseSubscription || isSubActive;
          console.log('🔐 Has access:', accessGranted, '(Trial active:', updatedTrialStatus.isActive, '| DB Sub:', hasDatabaseSubscription, '| Secure Sub:', isSubActive, ')');

          setHasAccess(accessGranted);

          // Redirect if NO access (trial expired AND no subscription)
          if (!accessGranted) {
            console.log('🚫 ACCESS DENIED - Trial expired and no subscription - redirecting to profile');
            router.push('/profile', { replace: true });
            return;
          } else {
            console.log('✅ ACCESS GRANTED - Trial active or subscription active');
          }
        } else {
          console.log('⚠️ No trial data found in localStorage');
          // If no trial data, check if user has subscription (prioritize database)
          const accessGranted = hasDatabaseSubscription || isSubActive;
          setHasAccess(accessGranted);

          if (!accessGranted) {
            console.log('🚫 No trial data and no subscription - redirecting to profile');
            router.push('/profile', { replace: true });
            return;
          } else {
            console.log('✅ ACCESS GRANTED - Database subscription or secure storage subscription active');
          }
        }
      } catch (error) {
        console.error('❌ Error checking access:', error);
        setHasAccess(false);
        router.push('/profile', { replace: true });
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
