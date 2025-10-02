'use client';

export default function HydrationScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
      __html: `
        (function() {
          // AGGRESSIVE CLEANING: Prevent extension attributes with maximum effectiveness
          const extensionAttributes = [
            'bis_skin_checked',
            'data-bis_skin_checked', 
            'data-bis_skin_checked_original',
            'data-bis_skin_checked_modified'
          ];
          
          function removeExtensionAttributes() {
            // Clean all elements more aggressively
            const allElements = document.querySelectorAll('*');
            allElements.forEach(element => {
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
          
          // More frequent cleaning to catch extension attributes
          setTimeout(removeExtensionAttributes, 0);
          setTimeout(removeExtensionAttributes, 50);
          setTimeout(removeExtensionAttributes, 100);
          setTimeout(removeExtensionAttributes, 200);
          setTimeout(removeExtensionAttributes, 500);
          
          // Aggressive observer with immediate cleaning
          if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
              removeExtensionAttributes();
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
          
          // Additional cleanup on window load
          window.addEventListener('load', removeExtensionAttributes);
        })();
        `,
      }}
    />
  );
}

