import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { initializeServiceWorker, clearAllCaches } from './utils/serviceWorker';
import FacebookPixelProvider from './components/FacebookPixelProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
// import NetworkStatus from './components/NetworkStatus';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import SafeErrorBoundary from './components/SafeErrorBoundary';
import webVitals from './utils/webVitals';
import analytics from './utils/analytics';
import { notificationService } from './utils/notificationService';
import './utils/sentry'; // Initialize Sentry first
import Home from './pages/Home';
import Courses from './pages/Courses';
import About from './pages/About';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAddCourseWizard from './pages/admin/AdminAddCourseWizard';
import AdminCourses from './pages/admin/AdminCourses';
import EditCourse from './pages/admin/EditCourse';
import CourseView from './pages/admin/CourseView';
import AddCourse from './pages/admin/AddCourse';
import AdminBlog from './pages/admin/AdminBlog';
import AddBlogPost from './pages/admin/AddBlogPost';
import ViewBlogPost from './pages/admin/ViewBlogPost';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import Subscription from './pages/Subscription';
import PaymentVerification from './pages/PaymentVerification';
import DashboardWithSidebar from './pages/DashboardWithSidebar';
import CourseOverview from './pages/course/CourseOverview';
import LessonPlayer from './pages/course/LessonPlayer';
import CourseComplete from './pages/course/CourseComplete';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Diploma from './pages/Diploma';
import Certificates from './pages/Certificates';
import Assessments from './pages/Assessments';
import Resume from './pages/Resume';
import Rooms from './pages/Rooms';
import Affiliates from './pages/Affiliates';
import './App.css';
import './styles/orientation.css'; // Import orientation CSS

function App() {
  const [appError, setAppError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // Force cache clearing for all users on app load
    const forceCacheClear = async () => {
      try {
        // Clear all browser caches
        await clearAllCaches();
        
        // Clear localStorage of old cached data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('cache') || key.includes('old') || key.includes('temp'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('Cache cleared for fresh content');
      } catch (error) {
        console.log('Cache clearing failed:', error);
      }
    };
    
    // Initialize monitoring first
    try {
      webVitals.startMonitoring();
      analytics.initialize();
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }

    // Initialize notifications
    try {
      // Request notification permission and initialize schedules
      if ('Notification' in window && Notification.permission === 'granted') {
        notificationService.initializeNotifications();
      } else if ('Notification' in window && Notification.permission === 'default') {
        // Request permission after a delay to not be too pushy
        setTimeout(async () => {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            notificationService.initializeNotifications();
          }
        }, 3000);
      }
    } catch (error) {
      console.warn('Notification initialization failed:', error);
    }
    
    // Force cache clear before initializing service worker
    forceCacheClear();
    
    // Initialize service worker for PWA functionality
    initializeServiceWorker();
    
    // Initialize course scheduler (temporarily disabled until DB migration)
    // const initializeCourseScheduler = async () => {
    //   try {
    //     const { CourseScheduler } = await import('./utils/courseScheduler');
    //     const scheduler = CourseScheduler.getInstance();
    //     scheduler.startScheduler();
    //   } catch (error) {
    //     console.error('Error initializing course scheduler:', error);
    //   }
    // };
    // initializeCourseScheduler();
    
    // Set loading to false after initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setAppError('An error occurred while loading the application. Please try refreshing the page.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setAppError('An error occurred while loading the application. Please try refreshing the page.');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Handle PWA orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      // Force viewport refresh on orientation change for PWA
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
      
      // Add orientation class to body for CSS targeting
      if (window.orientation === 90 || window.orientation === -90) {
        // Landscape
        document.body.classList.add('landscape-mode');
        document.body.classList.remove('portrait-mode');
      } else {
        // Portrait
        document.body.classList.add('portrait-mode');
        document.body.classList.remove('landscape-mode');
      }
    };

    // Initial orientation check
    handleOrientationChange();

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">King Ezekiel Academy</h1>
          <p className="text-gray-600">Loading your learning experience...</p>
        </div>
      </div>
    );
  }

  // Show error screen if there's an app error
  if (appError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">King Ezekiel Academy</h1>
          <p className="text-gray-600 mb-6">{appError}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => setAppError(null)} 
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            <p>If the problem persists, please try:</p>
            <ul className="mt-2 space-y-1">
              <li>• Disabling browser extensions</li>
              <li>• Using incognito/private mode</li>
              <li>• Trying a different browser</li>
              <li>• Checking your internet connection</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SafeErrorBoundary>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <FacebookPixelProvider />
            <ScrollToTop />
            <div className="App">
              <Navbar />
              {/* <NetworkStatus /> */}
              <main>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/payment-verification" element={<ProtectedRoute><PaymentVerification /></ProtectedRoute>} />
              <Route path="/dashboard-with-sidebar" element={<ProtectedRoute><DashboardWithSidebar /></ProtectedRoute>} />
              <Route path="/course/:id" element={<ProtectedRoute><CourseOverview /></ProtectedRoute>} />
              <Route path="/course/:id/overview" element={<ProtectedRoute><CourseOverview /></ProtectedRoute>} />
              <Route path="/course/:id/lesson/:lessonId" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
              <Route path="/course/:id/complete" element={<ProtectedRoute><CourseComplete /></ProtectedRoute>} />
              <Route path="/diploma" element={<ProtectedRoute><Diploma /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
              <Route path="/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
              <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
              <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
              <Route path="/affiliates" element={<ProtectedRoute><Affiliates /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
              <Route path="/admin/add-course" element={<AdminRoute><AdminAddCourseWizard /></AdminRoute>} />
              <Route path="/admin/edit-course/:id" element={<AdminRoute><EditCourse /></AdminRoute>} />
              <Route path="/admin/view-course/:id" element={<AdminRoute><CourseView /></AdminRoute>} />
              <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
              <Route path="/admin/add-blog-post" element={<AdminRoute><AddBlogPost /></AdminRoute>} />
              <Route path="/admin/view-blog-post/:id" element={<AdminRoute><ViewBlogPost /></AdminRoute>} />
              </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </SafeErrorBoundary>
  );
}

export default App;
