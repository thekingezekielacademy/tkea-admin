import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use a longer delay for mobile devices to ensure route change is complete
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const delay = isMobile ? 300 : 150;
    
    const scrollToTop = () => {
      // Method 1: Standard scrollTo
      window.scrollTo(0, 0);
      
      // Method 2: Document element scroll
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      
      // Method 3: Body scroll
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // Method 4: Main element scroll (if exists)
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTop = 0;
      }

      // Method 5: ScrollIntoView
      try {
        document.body.scrollIntoView({ 
          behavior: 'auto', 
          block: 'start', 
          inline: 'nearest' 
        });
      } catch (error) {
        // Fallback if scrollIntoView fails
      }
    };

    const timer = setTimeout(() => {
      // First attempt
      scrollToTop();

      // Second attempt for mobile devices
      if (isMobile) {
        setTimeout(() => {
          scrollToTop();
        }, 100);
        
        // Third attempt for stubborn mobile devices
        setTimeout(() => {
          scrollToTop();
        }, 300);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
