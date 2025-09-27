import { useEffect } from 'react';

export const useFacebookPixel = () => {
  useEffect(() => {
    // Facebook Pixel is initialized in layout.tsx
  }, []);

  const trackContact = (eventName: string, data: any) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Contact', data);
    }
  };

  const trackLead = (eventName: string, value: number, data: any) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', { value, currency: 'NGN', ...data });
    }
  };

  const trackCourseView = (courseId: string, courseTitle: string) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'course',
        content_ids: [courseId],
        content_name: courseTitle
      });
    }
  };

  const trackSearch = (searchTerm: string, resultsCount: number) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Search', {
        search_string: searchTerm,
        content_category: 'courses'
      });
    }
  };

  return {
    trackContact,
    trackLead,
    trackCourseView,
    trackSearch
  };
};
