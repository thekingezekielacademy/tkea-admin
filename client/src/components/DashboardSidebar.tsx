import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import './DashboardSidebar.css';
import { 
  FaHome, 
  FaBook, 
  FaTrophy, 
  FaUser, 
  FaStar, 
  FaCertificate, 
  FaPlay, 
  FaComments, 
  FaClipboardCheck, 
  FaShareAlt, 
  FaCog, 
  FaSignOutAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaGraduationCap,
  FaFileAlt,
  FaCreditCard
} from 'react-icons/fa';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  comingSoon?: boolean;
  badge?: string;
}

const DashboardSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isExpanded, setIsExpanded, isMobile } = useSidebar();

  // Sync local state with context
  useEffect(() => {
    setIsCollapsed(!isExpanded);
  }, [isExpanded]);

  // Check if we're on mobile - on mobile, sidebar is always visible but collapsed
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
      setIsMobileOpen(false); // No overlay on mobile
    }
  }, [isMobile]);

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
      id: 'levels',
      label: 'Levels',
      icon: <FaStar className="w-5 h-5" />,
      path: '/levels',
      comingSoon: true
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: <FaCertificate className="w-5 h-5" />,
      path: '/certificates',
      comingSoon: true
    },
    {
      id: 'resume',
      label: 'Résumé',
      icon: <FaFileAlt className="w-5 h-5" />,
      path: '/resume',
      comingSoon: true
    },
    {
      id: 'rooms',
      label: 'Rooms: Q&A',
      icon: <FaComments className="w-5 h-5" />,
      path: '/rooms',
      comingSoon: true
    },
    {
      id: 'assessments',
      label: 'Assessments',
      icon: <FaClipboardCheck className="w-5 h-5" />,
      path: '/assessments',
      comingSoon: true
    },
    {
      id: 'affiliates',
      label: 'Affiliates',
      icon: <FaShareAlt className="w-5 h-5" />,
      path: '/affiliates',
      comingSoon: true
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
    if (item.comingSoon) return; // Don't navigate for coming soon items
    
    navigate(item.path);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const toggleSidebar = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-0'} /* Always visible on mobile */
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.comingSoon}
                  className={`
                    w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 text-left
                    ${isActive(item.path) 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    ${item.comingSoon ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 text-gray-500">
                    {item.icon}
                  </span>
                  
                  {!isCollapsed && (
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{item.label}</span>
                        {item.comingSoon && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-orange-600 border border-orange-300 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer - Logout */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 text-left text-red-600 hover:bg-red-50
              ${isCollapsed ? 'justify-center' : ''}
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
