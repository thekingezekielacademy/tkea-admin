/**
 * Browser Compatibility Polyfills
 * Ensures the app works across different browsers and environments
 */

// Polyfill for Promise (for older browsers)
if (!window.Promise) {
  console.warn('Promise not supported, loading polyfill');
  // Load Promise polyfill from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js';
  document.head.appendChild(script);
}

// Polyfill for fetch (for older browsers)
if (!window.fetch) {
  console.warn('Fetch not supported, loading polyfill');
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js';
  document.head.appendChild(script);
}

// Polyfill for localStorage/sessionStorage (for private browsing)
const storageAvailable = (type: string): boolean => {
  try {
    const storage = window[type as keyof Window] as Storage;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

// Check and provide fallback for storage
if (!storageAvailable('localStorage')) {
  console.warn('localStorage not available, using memory storage');
  (window as any).localStorage = {
    _data: {},
    setItem: function(id: string, val: string) {
      this._data[id] = String(val);
    },
    getItem: function(id: string) {
      return this._data.hasOwnProperty(id) ? this._data[id] : null;
    },
    removeItem: function(id: string) {
      delete this._data[id];
    },
    clear: function() {
      this._data = {};
    }
  };
}

if (!storageAvailable('sessionStorage')) {
  console.warn('sessionStorage not available, using memory storage');
  (window as any).sessionStorage = {
    _data: {},
    setItem: function(id: string, val: string) {
      this._data[id] = String(val);
    },
    getItem: function(id: string) {
      return this._data.hasOwnProperty(id) ? this._data[id] : null;
    },
    removeItem: function(id: string) {
      delete this._data[id];
    },
    clear: function() {
      this._data = {};
    }
  };
}

// Polyfill for IntersectionObserver (for lazy loading)
if (!window.IntersectionObserver) {
  console.warn('IntersectionObserver not supported, loading polyfill');
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/intersection-observer@0.12.2/intersection-observer.js';
  document.head.appendChild(script);
}

// Polyfill for ResizeObserver (for responsive components)
if (!window.ResizeObserver) {
  console.warn('ResizeObserver not supported, loading polyfill');
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/resize-observer-polyfill@1.5.1/dist/ResizeObserver.global.js';
  document.head.appendChild(script);
}

// Global error handler for polyfill loading errors
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('polyfill')) {
    console.warn('Polyfill loading error:', event.message);
    // Don't let polyfill errors break the app
    event.preventDefault();
    return false;
  }
});

// Browser detection and compatibility warnings
const browserInfo = {
  userAgent: navigator.userAgent,
  isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
  isFirefox: /Firefox/.test(navigator.userAgent),
  isSafari: /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor),
  isEdge: /Edg/.test(navigator.userAgent),
  isIE: /MSIE|Trident/.test(navigator.userAgent),
  supportsServiceWorker: 'serviceWorker' in navigator,
  supportsWebP: document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0
};

// Log browser compatibility info
console.log('Browser compatibility info:', browserInfo);

// Warn about unsupported browsers
if (browserInfo.isIE) {
  console.warn('Internet Explorer is not supported. Please use a modern browser.');
  document.body.innerHTML = `
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
      <h1>Browser Not Supported</h1>
      <p>Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, Safari, or Edge.</p>
      <p>Download a modern browser:</p>
      <a href="https://www.google.com/chrome/" target="_blank">Chrome</a> |
      <a href="https://www.mozilla.org/firefox/" target="_blank">Firefox</a> |
      <a href="https://www.apple.com/safari/" target="_blank">Safari</a> |
      <a href="https://www.microsoft.com/edge/" target="_blank">Edge</a>
    </div>
  `;
}

export { browserInfo };
