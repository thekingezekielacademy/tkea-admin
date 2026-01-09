import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import AdminCourses from './components/AdminCourses';
import AdminAddCourseWizard from './components/AdminAddCourseWizard';
import EditCourse from './components/EditCourse';
import CourseView from './components/CourseView';
import SubscriptionManagement from './components/SubscriptionManagement';
import PurchaseManagement from './components/PurchaseManagement';
import LearningPathManagement from './components/LearningPathManagement';
import AddLearningPathWizard from './components/AddLearningPathWizard';
import LearningPathView from './components/LearningPathView';
import ManualAddToLibrary from './components/ManualAddToLibrary';
import ResellerAnalysisDashboard from './components/ResellerAnalysisDashboard';
import BlogManagement from './components/BlogManagement';
import AddEditBlogPost from './components/AddEditBlogPost';
import LiveClassesAll from './components/LiveClassesAll';
import LiveClassSessionView from './components/LiveClassSessionView';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/courses/add" element={<ProtectedRoute><AdminAddCourseWizard /></ProtectedRoute>} />
            <Route path="/admin/courses/edit/:id" element={<ProtectedRoute><EditCourse /></ProtectedRoute>} />
            <Route path="/admin/courses/view/:id" element={<ProtectedRoute><CourseView /></ProtectedRoute>} />
            <Route path="/admin/purchases" element={<ProtectedRoute><PurchaseManagement /></ProtectedRoute>} />
            <Route path="/admin/learning-paths" element={<ProtectedRoute><LearningPathManagement /></ProtectedRoute>} />
            <Route path="/admin/learning-paths/add" element={<ProtectedRoute><AddLearningPathWizard /></ProtectedRoute>} />
            <Route path="/admin/learning-paths/view/:id" element={<ProtectedRoute><LearningPathView /></ProtectedRoute>} />
            <Route path="/admin/manual-add-to-library" element={<ProtectedRoute><ManualAddToLibrary /></ProtectedRoute>} />
            <Route path="/admin/subscriptions" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
            <Route path="/admin/resellers" element={<ProtectedRoute><ResellerAnalysisDashboard /></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute><BlogManagement /></ProtectedRoute>} />
            <Route path="/admin/blog/add" element={<ProtectedRoute><AddEditBlogPost /></ProtectedRoute>} />
            <Route path="/admin/blog/edit/:id" element={<ProtectedRoute><AddEditBlogPost /></ProtectedRoute>} />
            <Route path="/live-classes/all" element={<ProtectedRoute><LiveClassesAll /></ProtectedRoute>} />
            <Route path="/live-classes/:liveClassId/session/:sessionId" element={<LiveClassSessionView />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

