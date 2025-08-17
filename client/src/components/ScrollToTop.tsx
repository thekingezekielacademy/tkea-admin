import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use a small delay to ensure the route change is complete
    const timer = setTimeout(() => {
      // Force scroll to top with multiple methods for better compatibility
      window.scrollTo(0, 0);
      
      // Also try scrolling the document element
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      
      // And the body element
      if (document.body) {
        document.body.scrollTop = 0;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
