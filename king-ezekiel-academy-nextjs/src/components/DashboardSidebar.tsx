'use client'
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextOptimized';
import { useSidebar } from '@/contexts/SidebarContext';
import './DashboardSidebar.css';
import { 
  FaHome, 
  FaBook, 
  FaGraduationCap, 
  FaTrophy, 
  FaCog, 
  FaSignOutAlt,
  FaStar,
  FaCertificate,
  FaFileAlt,
  FaComments,
  FaClipboardCheck,
  FaShareAlt,
  FaCreditCard,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { FaNairaSign } from 'react-icons/fa6';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

const DashboardSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { isExpanded, setIsExpanded, isMobile, toggleSidebar } = useSidebar();

  // Sync local state with context
  useEffect(() => {
    setIsCollapsed(!isExpanded);
  }, [isExpanded]);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FaHome className="w-5 h-5" />,
      path: '/dashboard'
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: <FaBook className="w-5 h-5" />,
      path: '/courses'
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: <FaTrophy className="w-5 h-5" />,
      path: '/achievements'
    },
    {
      id: 'diploma',
      label: 'Diploma (soon...)',
      icon: <FaStar className="w-5 h-5" />,
      path: '/diploma'
    },
    {
      id: 'certificates',
      label: 'Certificates (soon...)',
      icon: <FaCertificate className="w-5 h-5" />,
      path: '/certificates'
    },
    {
      id: 'resume',
      label: 'Résumé (soon...)',
      icon: <FaFileAlt className="w-5 h-5" />,
      path: '/resume'
    },
    {
      id: 'rooms',
      label: 'Rooms: Q&A (soon...)',
      icon: <FaComments className="w-5 h-5" />,
      path: '/rooms'
    },
    {
      id: 'assessments',
      label: 'Assessments (soon...)',
      icon: <FaClipboardCheck className="w-5 h-5" />,
      path: '/assessments'
    },
    {
      id: 'affiliates',
      label: 'Affiliates (soon...)',
      icon: <FaNairaSign className="w-5 h-5" />,
      path: '/affiliates'
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: <FaCreditCard className="w-5 h-5" />,
      path: '/subscription'
    },
    {
      id: 'settings',
      label: 'Settings/Profile',
      icon: <FaCog className="w-5 h-5" />,
      path: '/profile'
    }
  ];

  const handleItemClick = (item: SidebarItem) => {
    router.push(item.path);
  };

  // Remove local toggleSidebar - use context version

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Sidebar - Always visible, no toggle needed */}
      <div 
        className={`dashboard-sidebar-always-visible bg-white border-r border-gray-200 shadow-lg ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobile ? (isExpanded ? 'mobile-open' : 'mobile-hidden') : ''}`}
        style={{ 
          width: isCollapsed ? '4rem' : '16rem',
          overflowY: 'auto',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        {/* Header */}
        <div className={`flex items-center border-b border-gray-200 ${isCollapsed ? 'justify-start p-2' : 'justify-between p-4'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <FaGraduationCap className="w-6 h-6 text-primary-600" />
              <span className="font-semibold text-gray-800">Academy</span>
            </div>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isExpanded ? <FaChevronLeft className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full flex items-center ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-3'} rounded-lg transition-all duration-200 text-left cursor-pointer sidebar-item
                    ${isActive(item.path) 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 active' 
                      : 'text-gray-700 hover:bg-gray-50 hover:transform hover:translate-x-1'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 text-gray-500">
                    {item.icon}
                  </span>
                  
                  {!isCollapsed && (
                    <div className="ml-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {item.label.includes('(soon...)') ? (
                            <>
                              {item.label.replace(' (soon...)', '')}
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-orange-600 border border-orange-200 coming-soon-badge">
                                Soon
                              </span>
                            </>
                          ) : (
                            item.label
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer - Logout */}
        <div className={`border-t border-gray-200 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center ${isCollapsed ? 'px-2 py-3 justify-start' : 'px-3 py-3'} rounded-lg transition-all duration-200 text-left text-red-600 hover:bg-red-50 hover:transform hover:translate-x-1
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

    </>
  );
};

export default DashboardSidebar;
