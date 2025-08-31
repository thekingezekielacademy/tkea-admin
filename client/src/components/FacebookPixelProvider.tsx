import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactPixel from 'react-facebook-pixel';
import { FACEBOOK_PIXEL_ID, PIXEL_OPTIONS } from '../config/facebookPixel';

/**
 * Facebook Pixel Provider Component
 * 
 * This component initializes Facebook Pixel and tracks page views.
 * It must be used inside a Router context.
 */
const FacebookPixelProvider: React.FC = () => {
  const location = useLocation();

  // Initialize Facebook Pixel
  useEffect(() => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      ReactPixel.init(FACEBOOK_PIXEL_ID, undefined, PIXEL_OPTIONS);
      ReactPixel.pageView();
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (FACEBOOK_PIXEL_ID !== 'YOUR_PIXEL_ID') {
      ReactPixel.pageView();
    }
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default FacebookPixelProvider;
