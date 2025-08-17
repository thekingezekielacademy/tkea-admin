import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    console.log('🔄 ScrollToTop: Route changed to:', pathname);
    console.log('🔄 ScrollToTop: Current scroll position:', window.scrollY);
    
    // Use a small delay to ensure the route change is complete
    const timer = setTimeout(() => {
      console.log('🔄 ScrollToTop: Executing scroll to top...');
      
      // Temporarily disable smooth scrolling to ensure immediate scroll
      const htmlElement = document.documentElement;
      const originalScrollBehavior = htmlElement.style.scrollBehavior;
      htmlElement.style.scrollBehavior = 'auto';
      
      // Force scroll to top with multiple methods for better compatibility
      window.scrollTo(0, 0);
      
      // Also try scrolling the document element
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        console.log('🔄 ScrollToTop: Set documentElement.scrollTop to 0');
      }
      
      // And the body element
      if (document.body) {
        document.body.scrollTop = 0;
        console.log('🔄 ScrollToTop: Set body.scrollTop to 0');
      }
      
      // Re-enable smooth scrolling after a short delay
      setTimeout(() => {
        htmlElement.style.scrollBehavior = originalScrollBehavior;
        console.log('🔄 ScrollToTop: Re-enabled smooth scrolling');
      }, 200);
      
      // Check if scroll worked
      setTimeout(() => {
        console.log('🔄 ScrollToTop: Final scroll position:', window.scrollY);
        console.log('🔄 ScrollToTop: documentElement.scrollTop:', document.documentElement?.scrollTop);
        console.log('🔄 ScrollToTop: body.scrollTop:', document.body?.scrollTop);
      }, 50);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
