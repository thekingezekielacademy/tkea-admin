'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import hubspot from '@/utils/hubspot';

export function useHubSpot() {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize HubSpot on mount
    hubspot.initialize();
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (pathname) {
      hubspot.trackPageView(pathname);
    }
  }, [pathname]);

  return {
    trackEvent: hubspot.trackEvent.bind(hubspot),
    trackCustomBehavioralEvent: hubspot.trackCustomBehavioralEvent.bind(hubspot),
    identifyUser: hubspot.identifyUser.bind(hubspot),
    trackFormSubmit: hubspot.trackFormSubmit.bind(hubspot),
    trackCourseEnrollment: hubspot.trackCourseEnrollment.bind(hubspot),
    trackLessonComplete: hubspot.trackLessonComplete.bind(hubspot),
    trackSubscription: hubspot.trackSubscription.bind(hubspot),
  };
}

export default useHubSpot;

