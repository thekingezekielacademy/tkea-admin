import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { secureLog } from '../utils/secureLogger';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not loading and user is not authenticated, redirect to signin
    if (!loading && !user) {
      navigate('/signin');
      return;
    }

    // If not loading, user is authenticated, but not admin, silently redirect to dashboard
    if (!loading && user && !isAdmin) {
      secureLog('🔒 Non-admin user attempted to access admin route, silently redirecting to dashboard');
      navigate('/dashboard', { 
        replace: true,
        state: { redirectedFrom: window.location.pathname }
      });
      return;
    }
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
            Checking authentication...
          </div>
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
