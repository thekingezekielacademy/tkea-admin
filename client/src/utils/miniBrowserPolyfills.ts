/**
 * Enhanced Polyfills for Mini Browser Compatibility
 * Comprehensive polyfills for Instagram, Facebook, and other in-app browsers
 */

/**
 * Apply all necessary polyfills for mini browser compatibility
 * This function should be called before any React code runs
 */
export function applyMiniBrowserPolyfills(): void {
  console.log('🔧 Applying mini browser polyfills...');
  
  // Core polyfills that must be applied first
  applyCorePolyfills();
  applyArrayPolyfills();
  applyStringPolyfills();
  applyObjectPolyfills();
  applyNumberPolyfills();
  applyPromisePolyfills();
  applyFetchPolyfills();
  applyCryptoPolyfills();
  applyIntlPolyfills();
  
  console.log('✅ Mini browser polyfills applied successfully');
}

/**
 * Core polyfills for basic functionality
 */
function applyCorePolyfills(): void {
  // Object.assign polyfill
  if (!Object.assign) {
    Object.assign = function(target: any, ...sources: any[]): any {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      const to = Object(target);
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (source != null) {
          for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              to[key] = source[key];
            }
          }
        }
      }
      return to;
    };
  }

  // Array.from polyfill
  if (!Array.from) {
    Array.from = function(arrayLike: any, mapFn?: any, thisArg?: any): any[] {
      const C = this;
      const items = Object(arrayLike);
      const len = parseInt(items.length) || 0;
      const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
      let k = 0;
      let kValue;
      while (k < len) {
        kValue = items[k];
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
}

/**
 * Array method polyfills
 */
function applyArrayPolyfills(): void {
  // Array.prototype.includes
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement: any, fromIndex?: number): boolean {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (len === 0) return false;
      const n = parseInt(String(fromIndex)) || 0;
      let k = n >= 0 ? n : Math.max(len + n, 0);
      while (k < len) {
        if (O[k] === searchElement) return true;
        k++;
      }
      return false;
    };
  }

  // Array.prototype.find
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate: any, thisArg?: any): any {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      for (let i = 0; i < len; i++) {
        const value = O[i];
        if (predicate.call(thisArg, value, i, O)) {
          return value;
        }
      }
      return undefined;
    };
  }

  // Array.prototype.findIndex
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function(predicate: any, thisArg?: any): number {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      for (let i = 0; i < len; i++) {
        const value = O[i];
        if (predicate.call(thisArg, value, i, O)) {
          return i;
        }
      }
      return -1;
    };
  }

  // Array.prototype.flat
  if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth: number = 1): any[] {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      const A = [];
      let k = 0;
      
      function flatten(array: any[], depth: number): void {
        for (let i = 0; i < array.length; i++) {
          if (Array.isArray(array[i]) && depth > 0) {
            flatten(array[i], depth - 1);
          } else {
            A[k] = array[i];
            k++;
          }
        }
      }
      
      flatten(O, depth);
      return A;
    };
  }

  // Array.prototype.flatMap
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback: any, thisArg?: any): any[] {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
      }
      const A = [];
      let k = 0;
      for (let i = 0; i < len; i++) {
        const mappedValue = callback.call(thisArg, O[i], i, O);
        if (Array.isArray(mappedValue)) {
          for (let j = 0; j < mappedValue.length; j++) {
            A[k] = mappedValue[j];
            k++;
          }
        } else {
          A[k] = mappedValue;
          k++;
        }
      }
      return A;
    };
  }
}

/**
 * String method polyfills
 */
function applyStringPolyfills(): void {
  // String.prototype.startsWith
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString: string, position?: number): boolean {
      const pos = position || 0;
      return this.substring(pos, pos + searchString.length) === searchString;
    };
  }

  // String.prototype.endsWith
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString: string, length?: number): boolean {
      const len = length || this.length;
      return this.substring(len - searchString.length, len) === searchString;
    };
  }

  // String.prototype.includes
  if (!String.prototype.includes) {
    String.prototype.includes = function(searchString: string, position?: number): boolean {
      return this.indexOf(searchString, position) !== -1;
    };
  }

  // String.prototype.padStart
  if (!String.prototype.padStart) {
    String.prototype.padStart = function(targetLength: number, padString?: string): string {
      const str = String(this);
      const pad = padString || ' ';
      if (str.length >= targetLength) return str;
      const padLength = targetLength - str.length;
      const padStr = pad.repeat(Math.ceil(padLength / pad.length)).substring(0, padLength);
      return padStr + str;
    };
  }

  // String.prototype.padEnd
  if (!String.prototype.padEnd) {
    String.prototype.padEnd = function(targetLength: number, padString?: string): string {
      const str = String(this);
      const pad = padString || ' ';
      if (str.length >= targetLength) return str;
      const padLength = targetLength - str.length;
      const padStr = pad.repeat(Math.ceil(padLength / pad.length)).substring(0, padLength);
      return str + padStr;
    };
  }

  // String.prototype.replaceAll
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(searchValue: string | RegExp, replaceValue: string | ((substring: string, ...args: any[]) => string)): string {
      const str = String(this);
      if (searchValue instanceof RegExp) {
        if (!searchValue.global) {
          throw new TypeError('replaceAll must be called with a global RegExp');
        }
        return str.replace(searchValue, replaceValue as any);
      }
      return str.split(searchValue as string).join(replaceValue as string);
    };
  }
}

/**
 * Object method polyfills
 */
function applyObjectPolyfills(): void {
  // Object.entries
  if (!Object.entries) {
    Object.entries = function(obj: any): [string, any][] {
      const ownProps = Object.keys(obj);
      let i = ownProps.length;
      const resArray = new Array(i);
      while (i--) {
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
      }
      return resArray;
    };
  }

  // Object.values
  if (!Object.values) {
    Object.values = function(obj: any): any[] {
      const ownProps = Object.keys(obj);
      let i = ownProps.length;
      const resArray = new Array(i);
      while (i--) {
        resArray[i] = obj[ownProps[i]];
      }
      return resArray;
    };
  }

  // Object.fromEntries
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries: Iterable<[string, any]>): any {
      const obj = {};
      const entriesArray = Array.from(entries);
      for (let i = 0; i < entriesArray.length; i++) {
        const entry = entriesArray[i];
        obj[entry[0]] = entry[1];
      }
      return obj;
    };
  }
}

/**
 * Number method polyfills
 */
function applyNumberPolyfills(): void {
  // Number.isNaN
  if (!Number.isNaN) {
    Number.isNaN = function(value: any): boolean {
      return typeof value === 'number' && isNaN(value);
    };
  }

  // Number.isFinite
  if (!Number.isFinite) {
    Number.isFinite = function(value: any): boolean {
      return typeof value === 'number' && isFinite(value);
    };
  }

  // Number.isInteger
  if (!Number.isInteger) {
    Number.isInteger = function(value: any): boolean {
      return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    };
  }
}

/**
 * Promise method polyfills
 */
function applyPromisePolyfills(): void {
  // Promise.allSettled
  if (!Promise.allSettled) {
    Promise.allSettled = function(promises: Promise<any>[]): Promise<any[]> {
      return Promise.all(promises.map(promise => 
        Promise.resolve(promise)
          .then(value => ({ status: 'fulfilled', value }))
          .catch(reason => ({ status: 'rejected', reason }))
      ));
    };
  }
}

/**
 * Fetch polyfills
 */
function applyFetchPolyfills(): void {
  // Basic fetch polyfill (simplified)
  if (!window.fetch) {
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = typeof input === 'string' ? input : input.toString();
        
        xhr.open(init?.method || 'GET', url);
        
        if (init?.headers) {
          Object.keys(init.headers).forEach(key => {
            xhr.setRequestHeader(key, init.headers[key]);
          });
        }
        
        xhr.onload = function() {
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers()
          });
          resolve(response);
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        
        xhr.send(init?.body as any);
      });
    };
  }
}

/**
 * Crypto polyfills
 */
function applyCryptoPolyfills(): void {
  // crypto.getRandomValues fallback
  if (!window.crypto || !window.crypto.getRandomValues) {
    (window as any).crypto = (window as any).crypto || {};
    (window as any).crypto.getRandomValues = function(array: any): any {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }
}

/**
 * Intl polyfills
 */
function applyIntlPolyfills(): void {
  // Basic Intl polyfill
  if (!window.Intl) {
    window.Intl = {
      DateTimeFormat: function() {
        return {
          format: function(date: Date) {
            return date.toLocaleDateString();
          }
        };
      },
      NumberFormat: function() {
        return {
          format: function(num: number) {
            return num.toString();
          }
        };
      }
    } as any;
  }
}