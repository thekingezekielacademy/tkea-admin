import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { secureLog } from '../utils/secureLogger';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Admin route loading timeout - checking fallback');
        setLoadingTimeout(true);
        
        // Try to get admin status from localStorage as fallback
        try {
          const fallbackUser = JSON.parse(localStorage.getItem('user_profile') || 'null');
          if (fallbackUser && fallbackUser.role === 'admin') {
            console.log('Using fallback admin user for route access');
            // Allow access to admin route
            return;
          }
        } catch (error) {
          console.error('Fallback admin check failed:', error);
        }
        
        // If no fallback available, redirect to dashboard
        navigate('/dashboard', { 
          replace: true,
          state: { redirectedFrom: window.location.pathname, reason: 'loading_timeout' }
        });
      }
    }, 15000); // 15 second timeout

    // If not loading and user is not authenticated, redirect to signin
    if (!loading && !user) {
      clearTimeout(timeout);
      navigate('/signin');
      return;
    }

    // If not loading, user is authenticated, but not admin, silently redirect to dashboard
    if (!loading && user && !isAdmin) {
      clearTimeout(timeout);
      secureLog('🔒 Non-admin user attempted to access admin route, silently redirecting to dashboard');
      navigate('/dashboard', { 
        replace: true,
        state: { redirectedFrom: window.location.pathname }
      });
      return;
    }

    // Clear timeout if loading completes successfully
    if (!loading) {
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [user, loading, isAdmin, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {loadingTimeout ? 'Connection timeout - retrying...' : 'Checking authentication...'}
          </div>
          {loadingTimeout && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Having trouble connecting to the server.</p>
              <p>Please check your internet connection.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If no user, don't render children (will redirect to signin)
  if (!user) {
    return null;
  }

  // If user is not admin, don't render children (will redirect to dashboard)
  if (!isAdmin) {
    return null;
  }

  // If user is authenticated and is admin, render children
  return <>{children}</>;
};

export default AdminRoute;
