'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  getSidebarMargin: () => string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // On mobile, always start collapsed by default
      if (mobile) {
        setIsExpanded(false);
        if (!isInitialized) {
          setIsInitialized(true);
        }
      } else if (!mobile && !isInitialized) {
        // On desktop, start expanded if not initialized
        setIsExpanded(true);
        setIsInitialized(true);
      }
    };

    // Initial setup
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isInitialized]);

  const toggleSidebar = () => {
    setIsExpanded(prev => !prev);
  };

  const getSidebarMargin = () => {
    if (isMobile) {
      return 'ml-0';
    }
    return isExpanded ? 'ml-64' : 'ml-16';
  };

  const value = {
    isExpanded,
    setIsExpanded,
    isMobile,
    toggleSidebar,
    getSidebarMargin
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
