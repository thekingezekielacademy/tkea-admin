"use client";

import { useEffect } from 'react';

export default function HydrationFix() {
  useEffect(() => {
    // OPTIMIZED fix: Remove browser extension attributes efficiently
    const extensionAttributes = [
      'bis_skin_checked', 
      'data-bis_skin_checked',
      'data-bis_skin_checked_original',
      'data-bis_skin_checked_modified'
    ];
    
    const removeAttributes = () => {
      // Use single query selector for better performance
      const selector = extensionAttributes.map(attr => '[' + attr + ']').join(',');
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        extensionAttributes.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr);
          }
        });
      });
    };

    // Execute immediately on mount
    removeAttributes();
    
    // Run on DOM ready if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', removeAttributes, { once: true });
    }

    // Reduced timing intervals - only essential ones
    const intervals = [];
    const essentialTimings = [0, 50, 200]; // Reduced from 10 to 3
    for (let delay of essentialTimings) {
      intervals.push(setTimeout(removeAttributes, delay));
    }
    
    // Optimized MutationObserver with debouncing
    let observerTimeout;
    const observer = new MutationObserver((mutations) => {
      const hasExtensionAttributes = mutations.some(mutation => 
        mutation.type === 'attributes' && 
        mutation.attributeName && 
        extensionAttributes.includes(mutation.attributeName)
      );
      
      if (hasExtensionAttributes) {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(removeAttributes, 50); // Debounced
      }
    });

    // Start observing with optimized settings
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: extensionAttributes,
        subtree: true
      });
    }
    
    // Reduced periodic cleanup frequency
    const interval = setInterval(removeAttributes, 5000); // Every 5 seconds instead of 1

    return () => {
      // Cleanup
      intervals.forEach(intervalId => clearTimeout(intervalId));
      clearTimeout(observerTimeout);
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
}