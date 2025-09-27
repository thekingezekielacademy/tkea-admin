'use client'
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContextOptimized';
import { SidebarProvider } from '@/contexts/SidebarContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import MiniBrowserErrorBoundary from '@/components/MiniBrowserErrorBoundary';
import ClientOnly from '@/components/ClientOnly';
// import PerformanceMonitor from '@/components/PerformanceMonitor'; // Disabled for performance

interface ProvidersProps {
  children: React.ReactNode;
}

function ConditionalSidebar() {
  const pathname = usePathname();
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
    '/affiliates'
  ];

  useEffect(() => {
    setIsClient(true);
    
    // Check if current route should show sidebar
    const routeMatch = sidebarRoutes.some(route => pathname.startsWith(route));
    
    // For courses page, sidebar should NOT be shown globally - let the page handle it
    // The courses page has its own conditional sidebar logic
    setShouldShowSidebar(routeMatch);
  }, [pathname]);

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

export default function Providers({ children }: ProvidersProps) {
  return (
    <MiniBrowserErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <SidebarProvider>
            <div className="App min-h-screen bg-white" suppressHydrationWarning>
              <Navbar />
              <ConditionalSidebar />
              <main suppressHydrationWarning className="relative" style={{ position: 'relative', zIndex: '1' }}>
                {children}
              </main>
                    <Footer />
                    {/* <PerformanceMonitor /> Disabled for performance */}
                  </div>
                </SidebarProvider>
              </AuthProvider>
            </HelmetProvider>
          </MiniBrowserErrorBoundary>
        );
      }
