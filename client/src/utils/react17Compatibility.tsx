/**
 * React 17 Compatibility Wrapper for Mini Browsers
 * Provides ReactDOM.render fallback for Instagram/Facebook mini browsers
 */

import React from 'react';
import { detectMiniBrowser, needsReact17Mode } from './miniBrowserDetection';

/**
 * React 17 compatible render function
 * Uses ReactDOM.render instead of createRoot for mini browser compatibility
 */
export function renderReact17(
  element: React.ReactElement,
  container: HTMLElement,
  callback?: () => void
): void {
  const info = detectMiniBrowser();
  console.log(`${info.isMiniBrowser ? '📱' : '🌐'} Using React 17 compatibility mode`);
  
  try {
    // Use require for synchronous loading in mini browsers
    const ReactDOM = require('react-dom');
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Render using React 17 API
    ReactDOM.render(element, container, callback);
    
    console.log('✅ React 17 render completed successfully');
  } catch (error) {
    console.error('❌ React 17 render failed:', error);
    throw error;
  }
}

/**
 * React 18 compatible render function
 * Uses createRoot for modern browsers
 */
export async function renderReact18(
  element: React.ReactElement,
  container: HTMLElement
): Promise<void> {
  try {
    const { createRoot } = await import('react-dom/client');
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Create root and render
    const root = createRoot(container);
    root.render(element);
    
    console.log('✅ React 18 render completed successfully');
  } catch (error) {
    console.error('❌ React 18 render failed:', error);
    throw error;
  }
}

/**
 * Universal render function that automatically chooses the right method
 * Based on browser capabilities and mini browser detection
 */
export async function renderApp(
  element: React.ReactElement,
  container: HTMLElement,
  callback?: () => void
): Promise<void> {
  const info = detectMiniBrowser();
  const needsLegacy = needsReact17Mode();
  
  console.log(`🔧 Rendering app - Mini Browser: ${info.isMiniBrowser}, Legacy Mode: ${needsLegacy}`);
  
  if (needsLegacy) {
    // Use React 17 compatibility mode for mini browsers
    renderReact17(element, container, callback);
  } else {
    // Use React 18 for modern browsers
    try {
      await renderReact18(element, container);
    } catch (error) {
      console.warn('⚠️ React 18 failed, falling back to React 17:', error);
      renderReact17(element, container, callback);
    }
  }
}

/**
 * Check if React 18 features are supported
 */
export function supportsReact18(): boolean {
  try {
    // Check if createRoot is available
    return typeof window !== 'undefined' && 
           'ReactDOM' in window && 
           typeof (window as any).ReactDOM.createRoot === 'function';
  } catch {
    return false;
  }
}

/**
 * Get the appropriate React version string for debugging
 */
export function getReactVersion(): string {
  const info = detectMiniBrowser();
  const needsLegacy = needsReact17Mode();
  
  if (needsLegacy) {
    return 'React 17 (Legacy)';
  } else if (supportsReact18()) {
    return 'React 18 (Modern)';
  } else {
    return 'React 17 (Fallback)';
  }
}
