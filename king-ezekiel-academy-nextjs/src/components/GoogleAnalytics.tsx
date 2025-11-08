'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * GoogleAnalytics Component
 * 
 * Initializes Google Analytics and tracks page views on route changes.
 * Uses Next.js 13+ App Router navigation events.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get GA Measurement ID from environment (client-side env vars are available at build time)
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    if (!measurementId) {
      console.debug('Google Analytics: Measurement ID not configured');
      return;
    }

    // Initialize Google Analytics
    const initializeGA = () => {
      try {
        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        
        // Define gtag function
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }

        // Make gtag available globally
        (window as any).gtag = gtag;

        // Load Google Analytics script
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        script.async = true;
        script.onerror = () => {
          console.debug('Google Analytics: Failed to load script');
        };
        
        // Insert script before first script or at end of head
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }

        // Initialize gtag
        gtag('js', new Date());
        gtag('config', measurementId, {
          page_path: window.location.pathname,
          page_title: document.title,
          page_location: window.location.href,
        });

        console.debug('Google Analytics: Initialized successfully');
      } catch (error) {
        console.debug('Google Analytics: Initialization failed', error);
      }
    };

    // Only initialize if gtag doesn't exist
    if (typeof window !== 'undefined' && !(window as any).gtag) {
      initializeGA();
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    if (!measurementId || !(window as any).gtag) {
      return;
    }

    try {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      (window as any).gtag('config', measurementId, {
        page_path: url,
        page_title: document.title,
        page_location: window.location.origin + url,
      });

      console.debug('Google Analytics: Page view tracked', url);
    } catch (error) {
      console.debug('Google Analytics: Page view tracking failed', error);
    }
  }, [pathname, searchParams]);

  return null;
}

