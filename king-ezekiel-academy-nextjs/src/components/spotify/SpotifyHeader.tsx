'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaGraduationCap, FaSearch, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { HydrationSafeValue } from '@/components/HydrationSafeValue';

const SpotifyHeader: React.FC = () => {
  const { user, signOut, setOnSignOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Blog', path: '/blog' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-secondary-900 border-b border-secondary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <FaGraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white">
              TKEA
            </span>
          </Link>

          {/* Search Bar - Center (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search for courses or creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary-800 border border-secondary-700 rounded-full text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Navigation - Right (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.path
                      ? 'text-white'
                      : 'text-secondary-400 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            <HydrationSafeValue fallback={
              <Link
                href="/auth"
                className="px-4 py-2 bg-white text-secondary-900 rounded-full text-sm font-semibold hover:bg-secondary-100 transition-colors"
              >
                Log in
              </Link>
            }>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 px-3 py-2 bg-secondary-800 hover:bg-secondary-700 rounded-full text-sm text-white transition-colors"
                  >
                    <FaUser className="w-4 h-4" />
                    <span>{user?.name || user?.email || 'Student'}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-secondary-400 hover:text-white text-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="text-secondary-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-white text-secondary-900 rounded-full text-sm font-semibold hover:bg-secondary-100 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </HydrationSafeValue>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-secondary-400 hover:text-white"
            >
              {isMobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary-800 border border-secondary-700 rounded-full text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-secondary-700 pt-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                if (item.requiresAuth && !user) return null;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.path
                        ? 'bg-secondary-800 text-white'
                        : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <HydrationSafeValue fallback={null}>
                {user ? (
                  <div className="space-y-2 pt-2 border-t border-secondary-700">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 bg-secondary-800 rounded-lg text-sm text-white"
                    >
                      <FaUser className="w-4 h-4" />
                      <span>{user?.name || user?.email || 'Student'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-secondary-400 hover:text-white text-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-secondary-700">
                    <Link
                      href="/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2 text-secondary-400 hover:text-white text-sm"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2 bg-white text-secondary-900 rounded-lg text-sm font-semibold text-center"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </HydrationSafeValue>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default SpotifyHeader;

