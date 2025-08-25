import React from 'react';
import DashboardSidebar from '../components/DashboardSidebar';

const DashboardWithSidebar: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="ml-16 md:ml-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard with Sidebar Demo</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sample Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard</h2>
                <p className="text-gray-600 mb-4">
                  This is how your dashboard will look with the new sidebar navigation. The sidebar provides:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Easy navigation between different sections</li>
                  <li>Collapsible design to save space</li>
                  <li>Mobile-responsive overlay navigation</li>
                  <li>Professional WordPress-style appearance</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sidebar Features</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Dashboard - Main overview</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Courses - Browse and manage</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Achievements - XP and streaks</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Profile - User settings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">Levels, Certificates, Resume (Coming Soon)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Sidebar Navigation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  The sidebar is now visible on the left side of your screen. You can:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Click the toggle button to collapse/expand</li>
                  <li>• Navigate between different sections</li>
                  <li>• See which page is currently active</li>
                  <li>• Access logout functionality</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Coming Soon Features</h3>
                <p className="text-sm text-gray-600 mb-3">
                  These features are marked with "Soon" badges:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-orange-600 border border-orange-300 rounded-full">
                      Soon
                    </span>
                    <span className="text-sm text-gray-600">Levels System</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-orange-600 border border-orange-300 rounded-full">
                      Soon
                    </span>
                    <span className="text-sm text-gray-600">Certificates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-orange-600 border border-orange-300 rounded-full">
                      Soon
                    </span>
                    <span className="text-sm text-gray-600">Resume Builder</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWithSidebar;
