// Comprehensive polyfills for mini browser compatibility
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'whatwg-fetch';

// Additional polyfills for older browsers
if (typeof window !== 'undefined') {
  // Polyfill for Object.assign
  if (!Object.assign) {
    Object.assign = function(target, ...sources) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      const to = Object(target);
      for (let index = 0; index < sources.length; index++) {
        const nextSource = sources[index];
        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Polyfill for Array.includes
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('Array.prototype.includes called on null or undefined');
      }
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (len === 0) return false;
      const n = parseInt(String(fromIndex)) || 0;
      let k = n >= 0 ? n : Math.max(len + n, 0);
      while (k < len) {
        if (O[k] === searchElement) {
          return true;
        }
        k++;
      }
      return false;
    };
  }

  // Polyfill for String.includes
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // Polyfill for String.startsWith
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    };
  }

  // Polyfill for String.endsWith
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, length) {
      if (length === undefined || length > this.length) {
        length = this.length;
      }
      return this.substring(length - searchString.length, length) === searchString;
    };
  }

  // Polyfill for Promise
  if (!window.Promise) {
    window.Promise = require('es6-promise').Promise;
  }

  // Polyfill for Array.from
  if (!Array.from) {
    (Array as any).from = function(arrayLike: any, mapFn?: any, thisArg?: any) {
      const C = this;
      const items = Object(arrayLike);
      const len = parseInt(items.length) || 0;
      const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
      let k = 0;
      while (k < len) {
        const kValue = items[k];
        if (mapFn) {
          A[k] = typeof thisArg === 'undefined' ? mapFn(kValue, k) : mapFn.call(thisArg, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }

  // Polyfill for Object.keys
  if (!Object.keys) {
    Object.keys = function(obj) {
      if (obj !== Object(obj)) {
        throw new TypeError('Object.keys called on non-object');
      }
      const result = [];
      for (const prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }
      return result;
    };
  }

  // Polyfill for console.log (some mini browsers have limited console)
  if (!console.log) {
    console.log = function() {};
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 React App Starting - Loading with comprehensive polyfills');

// Force immediate React app loading to prevent interference
if (typeof window !== 'undefined') {
  // Override any potential interference from cached scripts
  window.addEventListener('load', function() {
    console.log('✅ Page fully loaded - React app should be running');
  });
  
  // Prevent any script from replacing the page content
  const originalWrite = document.write;
  document.write = function(content) {
    console.log('🚫 Blocked document.write attempt:', content.substring(0, 100));
    // Don't execute the write - let React handle the content
  };
  
  // Override any attempts to replace innerHTML
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(rootElement, 'innerHTML', {
      get: originalInnerHTML.get,
      set: function(value) {
        console.log('🚫 Blocked innerHTML replacement attempt');
        // Don't allow replacement of root content
      }
    });
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ Simple Test Index - React app rendered');
