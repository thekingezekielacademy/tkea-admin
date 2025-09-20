import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FACEBOOK_PIXEL_ID } from '../config/facebookPixel';

/**
 * Facebook Pixel Provider Component
 * 
 * This component initializes Facebook Pixel and tracks page views.
 * It must be used inside a Router context.
 */
const FacebookPixelProvider: React.FC = () => {
  const location = useLocation();

  // Track page views on route changes using standard fbq
  useEffect(() => {
    // Only track if not in mini browser and fbq is available
    if (typeof window !== 'undefined' && (window as any).fbq) {
      const ua = navigator.userAgent || '';
      const isMiniBrowser = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram|wv\)/i.test(ua);
      
      if (!isMiniBrowser) {
        (window as any).fbq('track', 'PageView');
      }
    }
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default FacebookPixelProvider;
