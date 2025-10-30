'use client'
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { useSidebar } from '@/contexts/SidebarContext';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isExpanded, isMobile } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  // Define routes where sidebar should be visible
  const sidebarRoutes = [
    '/dashboard',
    '/profile', 
    '/achievements',
    '/subscription',
    '/diploma',
    '/certificates',
    '/assessments',
    '/resume',
    '/rooms',
    '/affiliates'
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if current route should show sidebar
  const shouldShowSidebar = sidebarRoutes.some(route => pathname.startsWith(route)) || 
                           (pathname === '/courses' && user);

  // Calculate dynamic margin based on sidebar state - match CRA app exactly
  const getSidebarMargin = () => {
    if (!isClient) return 'ml-0'; // Prevent hydration mismatch
    if (!shouldShowSidebar) return 'ml-0'; // No sidebar on public pages
    if (isMobile) return 'ml-16'; // Mobile: show icon-only sidebar, add 64px margin
    return isExpanded ? 'ml-64' : 'ml-16'; // Desktop: expanded=256px, collapsed=64px
  };

  return (
    <div className={`${getSidebarMargin()} transition-all duration-300 ease-in-out`}>
      {children}
    </div>
  );
};

export default SidebarLayout;
