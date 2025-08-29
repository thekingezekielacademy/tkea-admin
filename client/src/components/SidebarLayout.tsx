import React from 'react';
import DashboardSidebar from './DashboardSidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="ml-16 md:ml-64 transition-all duration-300 ease-in-out">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
