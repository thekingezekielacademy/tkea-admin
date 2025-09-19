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
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 Simple Test Index - Starting React app');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ Simple Test Index - React app rendered');
