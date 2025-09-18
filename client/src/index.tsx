import 'core-js/stable';
import 'regenerator-runtime/runtime';
// Fetch polyfill must be first for older webviews
import 'whatwg-fetch';
// URL polyfill via core-js is already included; ensure presence
import 'core-js/web/url';

/* Ultra-safe synchronous global polyfills for IG/FB in-app browsers */
(function () {
  // fetch (synchronous minimal fallback)
  if (!(window as any).fetch) {
    (window as any).fetch = function (input: any, init?: any) {
      return new Promise((resolve, reject) => {
        try {
          const url = typeof input === 'string' ? input : input?.url;
          const method = init?.method || 'GET';
          const headers = init?.headers || {};
          const body = init?.body;

          const xhr = new XMLHttpRequest();
          xhr.open(method, url, true);

          if (headers && typeof headers === 'object') {
            Object.keys(headers).forEach((k) => xhr.setRequestHeader(k, (headers as any)[k]));
          }

          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
              const response = {
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                statusText: xhr.statusText,
                url,
                text: () => Promise.resolve(xhr.responseText),
                json: () => {
                  try { return Promise.resolve(JSON.parse(xhr.responseText)); } catch (e) { return Promise.reject(e); }
                },
                headers: { get: (name: string) => xhr.getResponseHeader(name) }
              } as any;
              resolve(response);
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          if (body != null) xhr.send(body); else xhr.send();
        } catch (e) { reject(e); }
      });
    };
  }

  // IntersectionObserver - minimal no-op fallback to avoid crashes in old Safari/in-app
  if (typeof window !== 'undefined' && !(window as any).IntersectionObserver) {
    (window as any).IntersectionObserver = function (this: any, cb: any) {
      this.observe = function () { try { cb && cb([{ isIntersecting: true }]); } catch {} };
      this.unobserve = function () {};
      this.disconnect = function () {};
    } as any;
  }

  // TextEncoder/TextDecoder minimal UTF-8 fallback for crypto/supabase usage
  if (typeof (window as any).TextEncoder === 'undefined') {
    (window as any).TextEncoder = class {
      encode(str: string) {
        try { return new Uint8Array(unescape(encodeURIComponent(str)).split('').map((c) => c.charCodeAt(0))); }
        catch { return new Uint8Array([]); }
      }
    } as any;
  }
  if (typeof (window as any).TextDecoder === 'undefined') {
    (window as any).TextDecoder = class {
      decode(arr: Uint8Array) {
        try { return decodeURIComponent(escape(String.fromCharCode.apply(null, Array.from(arr as any)))); }
        catch { return ''; }
      }
    } as any;
  }

  // Object.assign
  if (!Object.assign) {
    Object.assign = function (target: any, ...sources: any[]) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      const to = Object(target);
      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];
        if (src != null) {
          for (const key in src) {
            if (Object.prototype.hasOwnProperty.call(src, key)) {
              (to as any)[key] = src[key];
            }
          }
        }
      }
      return to;
    } as any;
  }

  // Array.prototype.includes
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      value: function (searchElement: any, fromIndex?: number) {
        if (this == null) throw new TypeError('"this" is null or not defined');
        const o = Object(this) as any;
        const len = o.length >>> 0;
        if (len === 0) return false;
        let n = fromIndex | 0;
        let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
          if (o[k] === searchElement || (Number.isNaN && Number.isNaN(o[k]) && Number.isNaN(searchElement))) return true;
          k++;
        }
        return false;
      },
      configurable: true,
      writable: true
    });
  }

  // String.prototype.startsWith
  if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
      value: function (search: string, pos?: number) {
        const position = pos ? Number(pos) : 0;
        return this.substring(position, position + String(search).length) === String(search);
      },
      configurable: true,
      writable: true
    });
  }

  // String.prototype.endsWith
  if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
      value: function (search: string, this_len?: number) {
        const str = String(this);
        const end = this_len === undefined || this_len > str.length ? str.length : this_len;
        const start = end - String(search).length;
        return str.substring(start, end) === String(search);
      },
      configurable: true,
      writable: true
    });
  }

  // Intl minimal fallback (NumberFormat/DateTimeFormat)
  if (!(window as any).Intl) {
    (window as any).Intl = {
      NumberFormat: function (locale?: string, options?: any) {
        return { format: (n: number) => (typeof (n as any)?.toLocaleString === 'function' ? n.toLocaleString(locale as any, options) : String(n)) } as any;
      },
      DateTimeFormat: function (locale?: string, options?: any) {
        return {
          format: (d: Date | number | string) => {
            try { const date = d instanceof Date ? d : new Date(d); return (date as any)?.toLocaleString ? date.toLocaleString(locale as any, options) : String(date); }
            catch { return String(d); }
          }
        } as any;
      }
    } as any;
  }

  // crypto.getRandomValues fallback (non-crypto safe, but prevents boot crashes)
  try {
    if (typeof (window as any).crypto === 'undefined') {
      (window as any).crypto = {} as any;
    }
    if (!(window as any).crypto.getRandomValues) {
      (window as any).crypto.getRandomValues = function (arr: Uint8Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      };
    }
  } catch {}

  console.log('[Polyfills Loaded]');
  (window as any).__KEA_POLYFILLS_LOADED__ = true;
})();

import './utils/polyfills';
import React from 'react';
import './index.css';
import 'plyr/dist/plyr.css';
import reportWebVitals from './reportWebVitals';

// Additional polyfills for Safari < 12 compatibility
if (typeof window !== 'undefined') {
  // Polyfill for String.prototype.replaceAll (Safari < 13)
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(search: string | RegExp, replace: string | Function): string {
      if (typeof search === 'string') {
        return this.split(search).join(replace as string);
      } else {
        return this.replace(new RegExp(search.source, 'g'), replace as any);
      }
    };
  }

  // Polyfill for Object.fromEntries (Safari < 12.1)
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries: any) {
      const result: any = {};
      const entriesArray = Array.isArray(entries) ? entries : Array.from(entries);
      for (let i = 0; i < entriesArray.length; i++) {
        const [key, value] = entriesArray[i];
        result[key] = value;
      }
      return result;
    };
  }

  // Polyfill for Array.prototype.flat (Safari < 12)
  if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth: number = 1): any[] {
      const result: any[] = [];
      const flatten = (arr: any[], currentDepth: number) => {
        for (const item of arr) {
          if (Array.isArray(item) && currentDepth > 0) {
            flatten(item, currentDepth - 1);
          } else {
            result.push(item);
          }
        }
      };
      flatten(this as any[], depth);
      return result;
    };
  }

  // Polyfill for Array.prototype.flatMap (Safari < 12)
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback: any, thisArg?: any): any[] {
      return (this as any[]).map(callback, thisArg).flat();
    };
  }
}

// Enhanced in-app browser detection and PWA compatibility
if (typeof window !== 'undefined') {
  const ua = navigator.userAgent + ' ' + (navigator.vendor || '') + ' ' + ((window as any).opera || '');
  const isInApp = /FBAN|FBAV|FBIOS|Instagram|Line|Twitter|LinkedIn|WhatsApp|Telegram/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isSafariOld = isSafari && /Version\/([0-9]+)/.test(ua) && parseInt(ua.match(/Version\/([0-9]+)/)[1]) < 12;
  
  // Store browser info globally for use throughout the app
  (window as any).browserInfo = {
    isInApp,
    isSafari,
    isSafariOld,
    userAgent: ua,
    supportsServiceWorker: 'serviceWorker' in navigator && !isInApp,
    supportsPWA: 'serviceWorker' in navigator && 'PushManager' in window && !isInApp
  };
  
  if (isInApp) {
    console.log('📱 In-app browser detected - PWA features disabled');
    console.log('User Agent:', ua);
    console.log('PWA features will be skipped for optimal compatibility');
    
    // Add visual indicator for debugging
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:blue;color:white;padding:5px;z-index:9999;font-family:monospace;font-size:12px;text-align:center;';
    debugDiv.textContent = `📱 In-App Browser - PWA Disabled for Compatibility`;
    document.body.appendChild(debugDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (debugDiv.parentNode) {
        debugDiv.parentNode.removeChild(debugDiv);
      }
    }, 3000);
  } else if (isSafariOld) {
    console.log('🍎 Old Safari detected - Enhanced compatibility mode');
    console.log('User Agent:', ua);
    console.log('Applying Safari < 12 compatibility fixes');
  } else {
    console.log('🌐 Regular browser detected - Full PWA features enabled');
    console.log('User Agent:', ua);
  }
}

// Global error logging for Safari and in-app browser debugging
window.onerror = function (message, source, lineno, colno, error) {
  const userAgent = navigator.userAgent;
  const isInstagram = /Instagram/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  console.error("❌ Global Error:", {
    message,
    source,
    lineno,
    colno,
    error: error?.stack || error,
    userAgent,
    isInstagram,
    isFacebook,
    isSafari,
    timestamp: new Date().toISOString()
  });
  
  // Also log to a more visible location for debugging
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
    
    let browserType = 'Safari';
    if (isInstagram) browserType = 'Instagram Browser';
    else if (isFacebook) browserType = 'Facebook Browser';
    else if (isSafari) browserType = 'Safari';
    
    errorDiv.textContent = `${browserType} Error: ${message} at ${source}:${lineno}:${colno}`;
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }
};

window.onunhandledrejection = function (event) {
  const userAgent = navigator.userAgent;
  const isInstagram = /Instagram/i.test(userAgent);
  const isFacebook = /FBAN|FBAV|FBIOS/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  console.error("❌ Unhandled Promise Rejection:", {
    reason: event.reason,
    promise: event.promise,
    userAgent,
    isInstagram,
    isFacebook,
    isSafari,
    timestamp: new Date().toISOString()
  });
  
  // Also log to a more visible location for debugging
  if (typeof document !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:50px;left:0;right:0;background:orange;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;';
    
    let browserType = 'Safari';
    if (isInstagram) browserType = 'Instagram Browser';
    else if (isFacebook) browserType = 'Facebook Browser';
    else if (isSafari) browserType = 'Safari';
    
    errorDiv.textContent = `${browserType} Promise Rejection: ${event.reason}`;
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }
};

async function loadApp() {
  try {
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }));
    }

    // In-app detection and hash bootstrap for HashRouter
    const ua = navigator.userAgent || '';
    const isInApp = /FBAN|FBAV|FBIOS|Instagram|wv\)/i.test(ua);
    const safariMatch = ua.match(/Version\/(\d+).+Safari/i);
    const safariMajor = safariMatch ? parseInt(safariMatch[1], 10) : null;
    const isOldSafari = !!safariMajor && safariMajor <= 12;
    if (isInApp && (!location.hash || location.hash === '#')) {
      location.hash = '/';
    }

    console.log('✅ Polyfills Loaded');
    (window as any).__KEA_BOOT_PROGRESS__ = 'polyfills-ready';

    // Pre-flight: force legacy client-only render for old Safari / IG/FB before any dynamic imports
    if (isOldSafari || isInApp) {
      try {
        const rootEl = (document.getElementById('root') as HTMLElement) || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'root' }));
        let ReactDOM: any = null;
        try { ReactDOM = require('react-dom'); } catch { ReactDOM = await import('react-dom'); }
        let AppMod: any = null;
        try { AppMod = require('./App').default; } catch { AppMod = (await import('./App')).default; }
        rootEl.innerHTML = '';
        (ReactDOM as any).render(<AppMod />, rootEl);
        (window as any).__KEA_HYDRATION_STATUS__ = 'client-only-legacy-preflight';
        (window as any).__KEA_BOOT_MODE__ = 'legacy-preflight';
        console.log('🟡 Forced Legacy Path (Pre-flight)');
        // Ensure SW is disabled in mini browsers
        if ('serviceWorker' in navigator && isInApp) {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
            console.log('🛑 SW disabled in mini browser');
          } catch {}
        }
        return;
      } catch (e) {
        console.error('[Pre-flight Legacy Error]', e);
        // Continue to modern flow if pre-flight fails
      }
    }

    // Conditional Service Worker: skip in in-app browsers
    if ('serviceWorker' in navigator) {
      if (isInApp) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
          console.log('🛑 SW disabled in mini browser');
        } catch {}
      } else {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
          console.warn('Service worker registration skipped/failed:', e);
        }
      }
    }

    // Dynamic import App with guard and retry
    console.log('[Boot] Loading React and App modules...');
    let AppMod: any = null;
    try {
      AppMod = (await import('./App')).default;
    } catch (e) {
      console.warn('[Boot] dynamic import failed, trying require fallback');
      try { AppMod = require('./App').default; } catch (e2) {
        console.error('[App Import Error]', e);
        (window as any).__KEA_HYDRATION_STATUS__ = 'boot-error';
        const warn = document.createElement('div');
        warn.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#111;color:#fff;padding:10px;font:12px/1.4 monospace;z-index:99999;text-align:center;';
        warn.textContent = 'App failed to load. Please refresh or open in external browser.';
        try { document.body.appendChild(warn); } catch {}
        return;
      }
    }

    const rootEl = (document.getElementById('root') as HTMLElement) || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'root' }));

    // Legacy Render Path for old Safari / in-app browsers
    if (isOldSafari || isInApp) {
      try {
        const ReactDOM = await import('react-dom');
        rootEl.innerHTML = '';
        (ReactDOM as any).render(<AppMod />, rootEl);
        (window as any).__KEA_HYDRATION_STATUS__ = 'client-only-legacy';
        (window as any).__KEA_BOOT_MODE__ = 'legacy';
        console.log('🟡 Legacy Render Path Activated');
      } catch (renderErr) {
        console.error('[Legacy Render Error]', renderErr);
        (window as any).__KEA_HYDRATION_STATUS__ = 'render-error';
      }
    } else {
      // Modern Path: hydrateRoot if SSR markup exists, else createRoot
      try {
        const rdc = await import('react-dom/client');
        const hasSSR = !!rootEl.firstChild;
        if ((rdc as any).hydrateRoot && hasSSR) {
          (rdc as any).hydrateRoot(rootEl, <AppMod />);
          (window as any).__KEA_BOOT_MODE__ = 'modern-hydrate';
          console.log('✅ modern hydrate');
        } else {
          const root = (rdc as any).createRoot(rootEl);
          root.render(
            <React.StrictMode>
              <AppMod />
            </React.StrictMode>
          );
          (window as any).__KEA_BOOT_MODE__ = 'modern-render';
          console.log('✅ modern render');
        }
      } catch (renderErr) {
        // Fallback to client-only render
        console.warn('⚠️ hydrate/createRoot error, falling back to client-only render', renderErr);
        try {
          const ReactDOM = await import('react-dom');
          rootEl.innerHTML = '';
          (ReactDOM as any).render(<AppMod />, rootEl);
          (window as any).__KEA_HYDRATION_STATUS__ = 'client-only-fallback';
          (window as any).__KEA_BOOT_MODE__ = 'fallback-render';
          console.warn('⚠️ Hydration failed, client-only render applied.');
        } catch (e2) {
          console.error('[Final Render Error]', e2);
          (window as any).__KEA_HYDRATION_STATUS__ = 'fallback-render-error';
        }
      }

      // 2s timeout: if not ok, switch to client-only render
      setTimeout(async () => {
        if ((window as any).__KEA_HYDRATION_STATUS__ === 'ok') return;
        const el = document.getElementById('root');
        if (!el) { (window as any).__KEA_HYDRATION_STATUS__ = 'no-root-after-render'; return; }
        if (el.firstChild) { (window as any).__KEA_HYDRATION_STATUS__ = 'ok'; return; }
        try {
          const ReactDOM = await import('react-dom');
          el.innerHTML = '';
          (ReactDOM as any).render(<AppMod />, el);
          (window as any).__KEA_HYDRATION_STATUS__ = 'client-only-fallback';
          console.warn('⚠️ Hydration timed out, client-only render applied.');
        } catch (e3) {
          console.error('[Timeout Fallback Error]', e3);
          (window as any).__KEA_HYDRATION_STATUS__ = 'fallback-render-error';
        }
      }, 2000);
    }

    // Dev diagnostics overlay
    try {
      if (process.env.NODE_ENV !== 'production') {
        const bar = document.createElement('div');
        bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#111;color:#fff;padding:6px 10px;font:11px/1.4 monospace;z-index:99999;text-align:center;opacity:.9;';
        const mode = (window as any).__KEA_BOOT_MODE__ || (isOldSafari || isInApp ? 'legacy' : 'modern');
        const hyd = (window as any).__KEA_HYDRATION_STATUS__ || 'pending';
        bar.textContent = `Mode: ${mode} | Polyfills: ✅ | Hydration: ${hyd}`;
        document.body.appendChild(bar);
      }
    } catch {}
  } catch (err) {
    console.error('❌ Failed to load app', err);
    try { (window as any).__KEA_HYDRATION_STATUS__ = 'boot-error'; } catch {}
    // Show a small non-intrusive banner instead of replacing the whole page
    try {
      const warn = document.createElement('div');
      warn.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#111;color:#fff;padding:10px;font:12px/1.4 monospace;z-index:99999;text-align:center;';
      warn.textContent = 'Browser encountered a boot error. Please refresh or open in external browser.';
      document.body.appendChild(warn);
    } catch {}
  }
}

// Kick off app load
loadApp();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
