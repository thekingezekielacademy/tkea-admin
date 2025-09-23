import React, { useEffect, useState } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
// STRIPPED: Removed FacebookPixelProvider
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import MiniBrowserErrorBoundary from './components/MiniBrowserErrorBoundary';
// ULTRA-SIMPLE: Removed complex browser detection and polyfills
import Home from './pages/Home';
import Courses from './pages/Courses';
import About from './pages/About';
import Contact from './pages/Contact';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AddCourse from './pages/admin/AddCourse';
import EditCourse from './pages/admin/EditCourse';
import CourseView from './pages/admin/CourseView';
import AdminBlog from './pages/admin/AdminBlog';
import AddBlogPost from './pages/admin/AddBlogPost';
import ViewBlogPost from './pages/admin/ViewBlogPost';
import Profile from './pages/Profile';
import CourseOverview from './pages/course/CourseOverview';
import LessonPlayer from './pages/course/LessonPlayer';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Certificates from './pages/Certificates';
import Assessments from './pages/Assessments';
import Resume from './pages/Resume';
import Rooms from './pages/Rooms';
import Diploma from './pages/Diploma';
import Subscription from './pages/Subscription';
import Achievements from './pages/Achievements';
import Affiliates from './pages/Affiliates';
import './App.css';
import './styles/orientation.css';

function App() {
  const [appError, setAppError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // LASER FIX: Simple initialization
    setIsLoading(false);
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>King Ezekiel Academy</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (appError) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>King Ezekiel Academy</h2>
          <p>Something went wrong. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            >
              Refresh Page
            </button>
        </div>
      </div>
    );
  }

  // Main app - LASER FIXED React 16 with HashRouter
  console.log('✅ App loaded successfully');

  return (
    <MiniBrowserErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <SidebarProvider>
            <HashRouter>
              <ScrollToTop />
              <div className="App">
                <Navbar />
                <main>
                  <Switch>
                    <Route exact path="/" component={Home} />
                    <Route exact path="/about" component={About} />
                    <Route exact path="/contact" component={Contact} />
                    <Route exact path="/courses" component={Courses} />
                    <Route exact path="/course/:id" component={CourseOverview} />
                    <Route exact path="/course/:courseId/lesson/:lessonId" component={LessonPlayer} />
                    <Route exact path="/signin" component={SignIn} />
                    <Route exact path="/signup" component={SignUp} />
                    <Route exact path="/forgot-password" component={ForgotPassword} />
                    <Route exact path="/blog" component={Blog} />
                    <Route exact path="/blog/:id" component={BlogPost} />
                    <Route exact path="/certificates" component={Certificates} />
                    <Route exact path="/assessments" component={Assessments} />
                    <Route exact path="/resume" component={Resume} />
                    <Route exact path="/rooms" component={Rooms} />
                    <Route exact path="/affiliates" component={Affiliates} />

                    {/* Protected routes */}
                    <Route exact path="/dashboard">
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    </Route>
                    <Route exact path="/profile">
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    </Route>
                    <Route exact path="/settings">
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    </Route>
                    <Route exact path="/achievements">
                      <ProtectedRoute>
                        <Achievements />
                      </ProtectedRoute>
                    </Route>
                    <Route exact path="/diploma">
                      <ProtectedRoute>
                        <Diploma />
                      </ProtectedRoute>
                    </Route>
                    <Route exact path="/subscription">
                      <ProtectedRoute>
                        <Subscription />
                      </ProtectedRoute>
                    </Route>

                    {/* Admin routes */}
                    <Route exact path="/admin/dashboard">
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    </Route>
                    <Route exact path="/admin/courses">
                      <AdminRoute>
                        <AdminCourses />
                      </AdminRoute>
                    </Route>
                    <Route exact path="/admin/add-course">
                      <AdminRoute>
                        <AddCourse />
                      </AdminRoute>
                    </Route>
                    <Route exact path="/admin/edit-course/:id">
                      <AdminRoute>
                        <EditCourse />
                      </AdminRoute>
                    </Route>
                    <Route exact path="/admin/course/:id">
                      <AdminRoute>
                        <CourseView />
                      </AdminRoute>
                    </Route>
                    <Route exact path="/admin/blog">
                      <AdminRoute>
                        <AdminBlog />
                      </AdminRoute>
                    </Route>
                    <Route exact path="/admin/add-blog">
                      <AdminRoute>
                        <AddBlogPost />
                      </AdminRoute>
                    </Route>
                    <Route exact path="/admin/blog/:id">
                      <AdminRoute>
                        <ViewBlogPost />
                      </AdminRoute>
                    </Route>
                  </Switch>
                </main>
                <Footer />
              </div>
            </HashRouter>
          </SidebarProvider>
        </AuthProvider>
      </HelmetProvider>
    </MiniBrowserErrorBoundary>
  );
}

export default App;