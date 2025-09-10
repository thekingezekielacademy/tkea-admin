import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { initializeServiceWorker } from './utils/serviceWorker';
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
  useEffect(() => {
    // Initialize monitoring first
    webVitals.startMonitoring();
    analytics.initialize();
    
    // Initialize service worker for caching and performance
    initializeServiceWorker();
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