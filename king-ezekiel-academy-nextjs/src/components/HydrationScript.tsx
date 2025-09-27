'use client';

export default function HydrationScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
      __html: `
        (function() {
          // OPTIMIZED CLEANING: Prevent extension attributes with minimal performance impact
          const extensionAttributes = [
            'bis_skin_checked',
            'data-bis_skin_checked', 
            'data-bis_skin_checked_original',
            'data-bis_skin_checked_modified'
          ];
          
          function removeExtensionAttributes() {
            // Use a single query selector for better performance
            const selector = extensionAttributes.map(attr => '[' + attr + ']').join(',');
            const elements = document.querySelectorAll(selector);
            
            // Batch DOM operations
            elements.forEach(element => {
              extensionAttributes.forEach(attr => {
                if (element.hasAttribute(attr)) {
                  element.removeAttribute(attr);
                }
              });
            });
          }
          
          // Execute immediately and on DOM ready
          removeExtensionAttributes();
          
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', removeExtensionAttributes, { once: true });
          }
          
          // Minimal scheduled cleaning - reduced from 6 timeouts to 2
          setTimeout(removeExtensionAttributes, 0);
          setTimeout(removeExtensionAttributes, 100);
          
          // Efficient observer with debouncing
          let observerTimeout;
          if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
              clearTimeout(observerTimeout);
              observerTimeout = setTimeout(removeExtensionAttributes, 50);
            });
            
            try {
              observer.observe(document, { 
                attributes: true, 
                subtree: true,
                attributeFilter: extensionAttributes
              });
            } catch (e) {
              // Silently fail if observer setup fails
            }
          }
        })();
        `,
      }}
    />
  );
}

