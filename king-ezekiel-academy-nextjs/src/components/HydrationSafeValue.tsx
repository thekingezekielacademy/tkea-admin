'use client';
import React, { useState, useEffect, ReactNode } from 'react';

interface HydrationSafeValueProps {
  children: ReactNode;
  fallback?: ReactNode;
  suppressHydrationWarning?: boolean;
}

/**
 * HydrationSafeValue Component
 * 
 * Prevents hydration mismatches by ensuring consistent rendering between server and client.
 * Only renders children after hydration is complete, preventing mismatches from:
 * - Date.now(), Math.random(), browser-specific APIs
 * - localStorage/sessionStorage access
 * - Dynamic values that differ between server and client
 * 
 * Usage:
 * <HydrationSafeValue fallback={<div>Loading...</div>}>
 *   <div>{new Date().toLocaleString()}</div>
 * </HydrationSafeValue>
 */
export const HydrationSafeValue: React.FC<HydrationSafeValueProps> = ({ 
  children, 
  fallback = null,
  suppressHydrationWarning = false 
}) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after the first render
    setIsHydrated(true);
  }, []);

  // During SSR and initial hydration, render fallback
  if (!isHydrated) {
    return <>{fallback}</>;
  }

  // After hydration, render children
  return (
    <div suppressHydrationWarning={suppressHydrationWarning}>
      {children}
    </div>
  );
};

/**
 * Hook for safely accessing client-only values
 * Returns null during SSR and initial hydration, then the actual value
 */
export const useHydrationSafeValue = <T>(value: T, fallback: T | null = null): T | null => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [safeValue, setSafeValue] = useState<T | null>(fallback);

  useEffect(() => {
    setIsHydrated(true);
    setSafeValue(value);
  }, [value]);

  return isHydrated ? value : fallback;
};

/**
 * Hook for safely accessing localStorage/sessionStorage
 * Prevents hydration mismatches from storage access
 */
export const useSafeStorage = (key: string, defaultValue: string | null = null) => {
  const [value, setValue] = useState<string | null>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = localStorage.getItem(key);
      setValue(stored);
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
      setValue(defaultValue);
    }
  }, [key, defaultValue]);

  const setStorageValue = (newValue: string | null) => {
    setValue(newValue);
    if (isHydrated) {
      try {
        if (newValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, newValue);
        }
      } catch (error) {
        console.warn('Failed to update localStorage:', error);
      }
    }
  };

  return [value, setStorageValue] as const;
};

/**
 * Hook for safely accessing browser APIs
 * Returns null during SSR, actual value after hydration
 */
export const useSafeBrowserAPI = <T>(getValue: () => T, fallback: T | null = null): T | null => {
  const [value, setValue] = useState<T | null>(fallback);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    try {
      setValue(getValue());
    } catch (error) {
      console.warn('Failed to access browser API:', error);
      setValue(fallback);
    }
  }, [getValue, fallback]);

  return value;
};

export default HydrationSafeValue;
