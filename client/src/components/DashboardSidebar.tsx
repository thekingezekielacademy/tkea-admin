import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
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
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-[100] transition-all duration-300 ease-in-out
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
                  className={`
                    w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 text-left cursor-pointer
                    ${isActive(item.path) 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 text-gray-500">
                    {item.icon}
                  </span>
                  
                  {!isCollapsed && (
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {item.label.includes('(soon...)') ? (
                            <>
                              {item.label.replace(' (soon...)', '')}
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                soon...
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
