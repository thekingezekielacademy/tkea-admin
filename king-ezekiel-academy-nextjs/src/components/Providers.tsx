'use client'
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from '@/contexts/AuthContextOptimized';
import { SidebarProvider } from '@/contexts/SidebarContext';
import SpotifyHeader from '@/components/spotify/SpotifyHeader';
import SpotifyFooter from '@/components/spotify/SpotifyFooter';
import DashboardSidebar from '@/components/DashboardSidebar';
import MiniBrowserErrorBoundary from '@/components/MiniBrowserErrorBoundary';
import ClientOnly from '@/components/ClientOnly';
import HubSpotProvider from '@/components/HubSpotProvider';
import GoogleAnalytics from '@/components/GoogleAnalytics';
// import PerformanceMonitor from '@/components/PerformanceMonitor'; // Disabled for performance

interface ProvidersProps {
  children: React.ReactNode;
}

function ConditionalSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [shouldShowSidebar, setShouldShowSidebar] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Define routes where sidebar should be visible (ONLY authenticated pages)
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
    '/affiliates',
    '/courses' // Add courses - will check user auth below
  ];

  useEffect(() => {
    setIsClient(true);
    
    // Don't show sidebar on homepage
    if (pathname === '/') {
      setShouldShowSidebar(false);
      return;
    }
    
    // Check if current route should show sidebar
    const routeMatch = sidebarRoutes.some(route => pathname.startsWith(route));
    
    // For courses page, only show sidebar if user is logged in
    if (pathname === '/courses' || pathname.startsWith('/course/')) {
      setShouldShowSidebar(routeMatch && !!user);
    } else {
      setShouldShowSidebar(routeMatch);
    }
  }, [pathname, user]);

  // Don't render anything on server side to prevent hydration mismatch
  if (!isClient || !shouldShowSidebar) {
    return null;
  }

  return (
    <ClientOnly>
      <DashboardSidebar />
    </ClientOnly>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <div className="App min-h-screen bg-secondary-950" suppressHydrationWarning>
      <SpotifyHeader />
      <ConditionalSidebar />
      <main suppressHydrationWarning className="relative min-h-screen" style={{ position: 'relative', zIndex: '1' }}>
        {/* Add padding for header - mobile has extra for search bar */}
        {/* Header: 64px (h-16) + Mobile search: ~56px = ~120px total */}
        <div className="pt-32 md:pt-16">
          {children}
        </div>
      </main>
      <SpotifyFooter />
      {/* <PerformanceMonitor /> Disabled for performance */}
    </div>
  );
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <MiniBrowserErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <SidebarProvider>
            <HubSpotProvider>
              <GoogleAnalytics />
              <AppContent>
                {children}
              </AppContent>
            </HubSpotProvider>
          </SidebarProvider>
        </AuthProvider>
      </HelmetProvider>
    </MiniBrowserErrorBoundary>
  );
}
