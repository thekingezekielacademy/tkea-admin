/**
 * Comprehensive Polyfills for Mini Browser Compatibility
 * This file provides essential polyfills for older WebView engines
 */

(function() {
  'use strict';
  
  console.log('🔧 Loading comprehensive polyfills for mini browser compatibility...');
  
  // 1. Promise Polyfill
  if (typeof Promise === 'undefined') {
    console.log('🔧 Adding Promise polyfill...');
    window.Promise = function(executor) {
      var self = this;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];
      
      function resolve(result) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function reject(error) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }
      
      this.then = function(onFulfilled, onRejected) {
        return new Promise(function(resolve, reject) {
          handle({
            onFulfilled: function(result) {
              try {
                resolve(onFulfilled ? onFulfilled(result) : result);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function(error) {
              try {
                resolve(onRejected ? onRejected(error) : error);
              } catch (ex) {
                reject(ex);
              }
            }
          });
        });
      };
      
      this.catch = function(onRejected) {
        return this.then(null, onRejected);
      };
      
      try {
        executor(resolve, reject);
      } catch (ex) {
        reject(ex);
      }
    };
    
    Promise.resolve = function(value) {
      return new Promise(function(resolve) {
        resolve(value);
      });
    };
    
    Promise.reject = function(value) {
      return new Promise(function(resolve, reject) {
        reject(value);
      });
    };
    
    Promise.all = function(promises) {
      return new Promise(function(resolve, reject) {
        var results = [];
        var remaining = promises.length;
        
        if (remaining === 0) {
          resolve(results);
          return;
        }
        
        promises.forEach(function(promise, index) {
          Promise.resolve(promise).then(function(result) {
            results[index] = result;
            remaining--;
            if (remaining === 0) {
              resolve(results);
            }
          }, reject);
        });
      });
    };
  }
  
  // 2. Array.includes Polyfill
  if (!Array.prototype.includes) {
    console.log('🔧 Adding Array.includes polyfill...');
    Array.prototype.includes = function(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('Array.prototype.includes called on null or undefined');
      }
      
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      
      var n = parseInt(fromIndex) || 0;
      var k = n >= 0 ? n : Math.max(len + n, 0);
      
      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }
      
      for (; k < len; k++) {
        if (sameValueZero(O[k], searchElement)) {
          return true;
        }
      }
      return false;
    };
  }
  
  // 3. Object.assign Polyfill
  if (typeof Object.assign !== 'function') {
    console.log('🔧 Adding Object.assign polyfill...');
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      
      var to = Object(target);
      
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
  
  // 4. String.includes Polyfill
  if (!String.prototype.includes) {
    console.log('🔧 Adding String.includes polyfill...');
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
  
  // 5. Fetch Polyfill (simplified)
  if (typeof fetch === 'undefined') {
    console.log('🔧 Adding fetch polyfill...');
    window.fetch = function(url, options) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(options && options.method || 'GET', url);
        
        if (options && options.headers) {
          for (var header in options.headers) {
            xhr.setRequestHeader(header, options.headers[header]);
          }
        }
        
        xhr.onload = function() {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: function() { return Promise.resolve(xhr.responseText); },
            json: function() { return Promise.resolve(JSON.parse(xhr.responseText)); }
          });
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        
        xhr.send(options && options.body);
      });
    };
  }
  
  // 6. Symbol Polyfill (minimal)
  if (typeof Symbol === 'undefined') {
    console.log('🔧 Adding Symbol polyfill...');
    window.Symbol = function(description) {
      return 'Symbol(' + (description || '') + ')_' + Math.random().toString(36).substr(2, 9);
    };
    
    Symbol.for = function(key) {
      if (!Symbol._registry) {
        Symbol._registry = {};
      }
      if (!Symbol._registry[key]) {
        Symbol._registry[key] = Symbol(key);
      }
      return Symbol._registry[key];
    };
    
    Symbol.iterator = Symbol('Symbol.iterator');
  }
  
  // 7. Map Polyfill (basic)
  if (typeof Map === 'undefined') {
    console.log('🔧 Adding Map polyfill...');
    window.Map = function() {
      this._keys = [];
      this._values = [];
    };
    
    Map.prototype.set = function(key, value) {
      var index = this._keys.indexOf(key);
      if (index === -1) {
        this._keys.push(key);
        this._values.push(value);
      } else {
        this._values[index] = value;
      }
      return this;
    };
    
    Map.prototype.get = function(key) {
      var index = this._keys.indexOf(key);
      return index === -1 ? undefined : this._values[index];
    };
    
    Map.prototype.has = function(key) {
      return this._keys.indexOf(key) !== -1;
    };
    
    Map.prototype.delete = function(key) {
      var index = this._keys.indexOf(key);
      if (index !== -1) {
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
        return true;
      }
      return false;
    };
  }
  
  // 8. Set Polyfill (basic)
  if (typeof Set === 'undefined') {
    console.log('🔧 Adding Set polyfill...');
    window.Set = function() {
      this._values = [];
    };
    
    Set.prototype.add = function(value) {
      if (this._values.indexOf(value) === -1) {
        this._values.push(value);
      }
      return this;
    };
    
    Set.prototype.has = function(value) {
      return this._values.indexOf(value) !== -1;
    };
    
    Set.prototype.delete = function(value) {
      var index = this._values.indexOf(value);
      if (index !== -1) {
        this._values.splice(index, 1);
        return true;
      }
      return false;
    };
  }
  
  // iOS Safari specific fixes
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    console.log('🔧 Adding iOS Safari specific fixes...');
    
    // Fix iOS Safari touch events
    document.addEventListener('touchstart', function() {}, { passive: true });
    document.addEventListener('touchmove', function() {}, { passive: true });
    document.addEventListener('touchend', function() {}, { passive: true });
    
    // Fix iOS Safari scroll issues
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Fix iOS Safari viewport issues
    var viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover');
    }
    
    // Fix iOS Safari hash routing
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#/';
    }
    
    // Fix iOS Safari memory issues
    window.addEventListener('pagehide', function() {
      // Clear any temporary storage on page unload
      if (window.__tempStorage) {
        window.__tempStorage = {};
      }
    });
    
    // Fix iOS Safari input zoom
    var inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(function(input) {
      input.style.fontSize = '16px';
    });
    
    console.log('✅ iOS Safari fixes applied');
  }
  
  console.log('✅ Comprehensive polyfills loaded successfully');
})();
