import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, signOut, setOnSignOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo(0, 0);
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

  const authItems = [
    { name: 'Sign In', path: '/signin' },
    { name: 'Sign Up', path: '/signup' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation is now handled by the onSignOut callback
    } catch (error) {
      // Fallback navigation in case of error
      window.location.href = '/';
    }
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and User Info (Left Side) */}
          <div className="flex items-center space-x-8">
            <Link to="/" onClick={scrollToTop} className="flex items-center">
              <Logo size="lg" />
            </Link>
            
            {/* User Name and Icon (when signed in) */}
            {user && (
              <Link 
                to="/profile"
                onClick={scrollToTop}
                className="flex items-center space-x-2 px-3 py-1 bg-primary-50 rounded-lg border border-primary-200 hover:bg-primary-100 hover:border-primary-300 transition-all duration-200 cursor-pointer group"
                title="Click to view profile"
              >
                <FaUser className="h-4 w-4 text-primary-600 group-hover:text-primary-700" />
                <span className="text-sm font-medium text-primary-700 group-hover:text-primary-800">
                  {user?.name || user?.email || 'Student'}
                </span>
                <svg className="h-3 w-3 text-primary-500 group-hover:text-primary-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={scrollToTop}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-secondary-700 hover:text-primary-500'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Dashboard (only when signed in) */}
            {user && (
              <Link
                to="/dashboard"
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
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
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
              authItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={scrollToTop}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    item.name === 'Sign Up'
                      ? 'bg-primary-900 text-white hover:bg-primary-800 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold'
                      : 'text-secondary-700 hover:text-primary-500'
                  }`}
                >
                  {item.name}
                </Link>
              ))
            )}
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
                to={item.path}
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
                to="/dashboard"
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
              {user ? (
                <div className="space-y-2">
                  {/* User Info Display */}
                  <Link 
                    to="/profile"
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
                authItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                      item.name === 'Sign Up'
                        ? 'bg-primary-900 text-white hover:bg-primary-800 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold'
                        : 'text-secondary-700 hover:text-primary-500'
                    }`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      scrollToTop();
                    }}
                  >
                    {item.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;