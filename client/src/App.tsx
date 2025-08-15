import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NetworkStatus from './components/NetworkStatus';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
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
import CourseOverview from './pages/course/CourseOverview';
import LessonPlayer from './pages/course/LessonPlayer';
import CourseComplete from './pages/course/CourseComplete';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <NetworkStatus />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
              <Route path="/admin/courses/new" element={<AdminRoute><AdminAddCourseWizard /></AdminRoute>} />
              <Route path="/admin/courses/:courseId/edit" element={<AdminRoute><EditCourse /></AdminRoute>} />
              <Route path="/admin/courses/:courseId/view" element={<AdminRoute><CourseView /></AdminRoute>} />
              <Route path="/admin/add-course" element={<AdminRoute><AddCourse /></AdminRoute>} />
              <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
              <Route path="/admin/blog/new" element={<AdminRoute><AddBlogPost /></AdminRoute>} />
                              <Route path="/admin/blog/:id/edit" element={<AdminRoute><AddBlogPost /></AdminRoute>} />
                <Route path="/admin/blog/:id/view" element={<AdminRoute><ViewBlogPost /></AdminRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/course/:id" element={<ProtectedRoute><CourseOverview /></ProtectedRoute>} />
              <Route path="/course/:id/overview" element={<ProtectedRoute><CourseOverview /></ProtectedRoute>} />
              <Route path="/course/:id/lesson/:lessonId" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
              <Route path="/course/:id/complete" element={<ProtectedRoute><CourseComplete /></ProtectedRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
