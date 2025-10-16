'use client';

export default function HydrationScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
      __html: `
        (function() {
          // Optimized extension attribute cleaning - performance-focused
          const extensionAttributes = [
            'bis_skin_checked',
            'data-bis_skin_checked', 
            'data-bis_skin_checked_original',
            'data-bis_skin_checked_modified'
          ];
          
          let cleanupScheduled = false;
          
          function removeExtensionAttributes() {
            // Use requestIdleCallback for better performance when available
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => cleanExtensionAttrs(), { timeout: 500 });
            } else {
              cleanExtensionAttrs();
            }
          }
          
          function cleanExtensionAttrs() {
            cleanupScheduled = false;
            // More efficient: only query elements that might have these attributes
            const elements = document.querySelectorAll('[bis_skin_checked], [data-bis_skin_checked], [data-bis_skin_checked_original], [data-bis_skin_checked_modified]');
            elements.forEach(element => {
              extensionAttributes.forEach(attr => {
                element.removeAttribute(attr);
              });
            });
          }
          
          // Execute only once on DOM ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', removeExtensionAttributes, { once: true });
          } else {
            removeExtensionAttributes();
          }
          
          // Optimized observer - debounced to prevent excessive cleaning
          if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
              if (!cleanupScheduled) {
                cleanupScheduled = true;
                removeExtensionAttributes();
              }
            });
            
            try {
              observer.observe(document.documentElement, { 
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

