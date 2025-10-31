'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaGraduationCap, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { useSidebar } from '@/contexts/SidebarContext';
import { HydrationSafeValue } from '@/components/HydrationSafeValue';

const Navbar: React.FC = () => {
  const { user, signOut, setOnSignOut, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  // Optimized navigation with loading states
  const handleNavigation = (path: string) => {
    if (isNavigating) return; // Prevent multiple clicks
    
    setIsNavigating(true);
    router.push(path);
    
    // Reset loading state after navigation
    setTimeout(() => setIsNavigating(false), 1000);
  };

  // Set up the onSignOut callback to navigate to home
  useEffect(() => {
    setOnSignOut(() => () => {
      // Use window.location.href for sign out to ensure complete session cleanup
      window.location.href = '/';
    });
    
    // Cleanup function
    return () => setOnSignOut(null);
  }, [setOnSignOut]);


  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Blog', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    // Dashboard will be conditionally added after Contact
  ];

  const showCta = pathname !== '/auth';

  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation is now handled by the onSignOut callback
    } catch (error) {
      // Fallback navigation in case of error
      window.location.href = '/';
    }
  };

  const { isExpanded, isMobile } = useSidebar();
  const [sidebarState, setSidebarState] = useState({ isExpanded, isMobile });
  
  // Force re-render when sidebar state changes
  useEffect(() => {
    setSidebarState({ isExpanded, isMobile });
  }, [isExpanded, isMobile]);
  
  // Check if we're on a page with sidebar
  const hasSidebar = ['/dashboard', '/dashboard-new', '/profile', '/achievements', '/subscription', '/diploma', '/certificates', '/assessments', '/resume', '/rooms', '/affiliates'].includes(pathname) || 
                     (pathname === '/courses' && user);

  // Calculate dynamic margin and width based on sidebar state (desktop only)
  const getSidebarMargin = () => {
    if (!hasSidebar) return 'w-full'; // No sidebar, full width
    if (sidebarState.isMobile) return 'ml-0 w-full'; // Mobile: no margin, let sidebar overlay
    return sidebarState.isExpanded ? 'ml-64 w-[calc(100%-16rem)]' : 'ml-16 w-[calc(100%-4rem)]'; // Desktop: dynamic width
  };

  return (
    <>
      <nav className={`bg-white shadow-lg fixed top-0 left-0 w-full z-[50] transition-all duration-300 ease-in-out ${getSidebarMargin()}`} suppressHydrationWarning>
        <div className={`${hasSidebar ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8`} suppressHydrationWarning>
          <div className="flex justify-between h-16" suppressHydrationWarning>
            {/* Logo and User Info (Left Side) */}
            <div className="flex items-center space-x-8" suppressHydrationWarning>
              <Link href="/" onClick={scrollToTop} className="flex items-center space-x-2">
                <FaGraduationCap className="h-8 w-8 text-primary-500" />
                <span className="hidden md:block text-xl font-bold text-secondary-900">King Ezekiel Academy</span>
                <span className="md:hidden text-xl font-bold text-secondary-900">TKEA</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8" suppressHydrationWarning>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(item.path);
                    scrollToTop();
                  }}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-secondary-700 hover:text-primary-500'
                  } ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isNavigating ? 'Loading...' : item.name}
                </Link>
              ))}
              {/* Dashboard (only when signed in) - wrapped in HydrationSafeValue */}
              <HydrationSafeValue fallback={null}>
                {user && (
                  <Link
                    href="/dashboard"
                    onClick={scrollToTop}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive('/dashboard')
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-secondary-700 hover:text-primary-500'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
              </HydrationSafeValue>
            </div>

            {/* Desktop CTA - wrapped in HydrationSafeValue */}
            <div className="hidden md:flex items-center space-x-4" suppressHydrationWarning>
              <HydrationSafeValue fallback={
                showCta ? (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/auth"
                      onClick={scrollToTop}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-primary-900 text-white hover:bg-primary-800 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold`}
                    >
                      Get started
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4" />
                )
              }>
                {user ? (
                  <div className="flex items-center space-x-4">
                    {/* User Info Display - Clickable to Dashboard */}
                    <Link 
                      href="/dashboard"
                      onClick={scrollToTop}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors duration-200"
                    >
                      <FaUser className="text-primary-500" />
                      <span className="font-medium">{user?.name || user?.email || 'Student'}</span>
                    </Link>
                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <FaSignOutAlt />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  showCta ? (
                    <div className="flex items-center space-x-4">
                      <Link
                        href="/auth"
                        onClick={scrollToTop}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-primary-900 text-white hover:bg-primary-800 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold`}
                      >
                        Get started
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4" />
                  )
                )}
              </HydrationSafeValue>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-secondary-700 hover:text-primary-500 focus:outline-none focus:text-primary-500"
              >
                {isMobileMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-secondary-700 hover:text-primary-500 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToTop();
                  }}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive('/dashboard')
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-secondary-700 hover:text-primary-500 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToTop();
                  }}
                >
                  Dashboard
                </Link>
              )}

              <div className="pt-4 pb-3 border-t border-gray-200">
                <HydrationSafeValue fallback={
                  showCta ? (
                    <Link
                      href="/auth"
                      className="block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 bg-primary-900 text-white hover:bg-primary-800 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        scrollToTop();
                      }}
                    >
                      Get started
                    </Link>
                  ) : (
                    <div />
                  )
                }>
                  {user ? (
                    <div className="space-y-2">
                      {/* User Info Display */}
                      <Link 
                        href="/dashboard"
                        className="block px-3 py-2 text-sm text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-all duration-200"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          scrollToTop();
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <FaUser className="text-primary-500" />
                          <span className="font-medium">{user?.name || user?.email || 'Student'}</span>
                        </div>
                      </Link>
                      {/* Sign Out Button */}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    showCta ? (
                      <Link
                        href="/auth"
                        className="block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 bg-primary-900 text-white hover:bg-primary-800 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          scrollToTop();
                        }}
                      >
                        Get started
                      </Link>
                    ) : (
                      <div />
                    )
                  )}
                </HydrationSafeValue>
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Add content spacer to prevent content being covered by navbar */}
      <div style={{ height: '64px' }} aria-hidden="true" />
    </>
  );
};

export default Navbar;
