import React, { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { registerServiceWorker } from './utils/serviceWorker';
import FacebookPixelProvider from './components/FacebookPixelProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import SafeErrorBoundary from './components/SafeErrorBoundary';
import { getBrowserInfo, applyBrowserFixes, shouldUseSimplifiedMode } from './utils/simpleBrowserDetection';
import { addEssentialPolyfills, safeFeatureCheck } from './utils/essentialPolyfills';
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
import PWAInstall from './pages/PWAInstall';
import './App.css';
import './styles/orientation.css';

function App() {
  const [appError, setAppError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Get browser info
        const browserInfo = getBrowserInfo();
        console.log('🔍 Browser Info:', browserInfo);
        
        // 2. Apply essential polyfills
        addEssentialPolyfills();
        
        // 3. Apply browser-specific fixes
        applyBrowserFixes();
        
        // 4. Register service worker (always)
        if (safeFeatureCheck.hasServiceWorker()) {
          await registerServiceWorker();
        }
        
        // 5. Initialize non-critical features only if supported
        if (!shouldUseSimplifiedMode()) {
          // Only initialize complex features for modern browsers
          try {
            // Initialize analytics if supported
            if (safeFeatureCheck.hasFetch()) {
              // Analytics initialization here
            }
            
            // Initialize notifications if supported
            if (safeFeatureCheck.hasNotifications()) {
              // Notification initialization here
            }
          } catch (error) {
            console.warn('Non-critical feature initialization failed:', error);
          }
        }
        
        // 6. Disable Flutterwave fingerprinting for compatibility
        if (typeof window !== 'undefined') {
          (window as any).FlutterwaveDisableFingerprinting = true;
          (window as any).FlutterwaveDisableTracking = true;
          (window as any).FlutterwaveDisableAnalytics = true;
        }
        
        // 7. App ready
        setIsLoading(false);
        console.log('✅ App initialized successfully');
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setAppError('Failed to initialize application. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading King Ezekiel Academy...</h2>
          <p className="text-gray-600 mt-2">Please wait while we prepare your learning experience</p>
        </div>
      </div>
    );
  }

  // Show error screen
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
        </div>
      </div>
    );
  }

  // Main app
  return (
    <SafeErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <SidebarProvider>
            <HashRouter>
              <FacebookPixelProvider />
              <ScrollToTop />
              <div className="App">
                <Navbar />
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
                    <Route path="/admin/course/:id" element={<AdminRoute><CourseView /></AdminRoute>} />
                    <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
                    <Route path="/admin/add-blog" element={<AdminRoute><AddBlogPost /></AdminRoute>} />
                    <Route path="/admin/blog/:id" element={<AdminRoute><ViewBlogPost /></AdminRoute>} />
                  </Routes>
                </main>
                <Footer />
                <PWAInstall />
              </div>
            </HashRouter>
          </SidebarProvider>
        </AuthProvider>
      </HelmetProvider>
    </SafeErrorBoundary>
  );
}

export default App;
