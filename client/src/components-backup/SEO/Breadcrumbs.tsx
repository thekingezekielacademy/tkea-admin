import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';
import { generateBreadcrumbs } from '../../utils/seoUrlUtils';
import { generateBreadcrumbStructuredData } from './StructuredData';
import SEOHead from './SEOHead';

interface BreadcrumbsProps {
  pageTitle?: string;
  customBreadcrumbs?: Array<{ name: string; url: string }>;
  showStructuredData?: boolean;
  className?: string;
}

/**
 * Breadcrumbs Component - SEO-optimized navigation
 * 
 * Features:
 * - Automatic breadcrumb generation from URL
 * - Custom breadcrumb support
 * - JSON-LD structured data
 * - SEO-friendly navigation
 * - Responsive design
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  pageTitle,
  customBreadcrumbs,
  showStructuredData = true,
  className = ''
}) => {
  const location = useLocation();
  
  // Generate breadcrumbs from URL or use custom ones
  const breadcrumbs = customBreadcrumbs || generateBreadcrumbs(location.pathname);
  
  // Generate structured data for breadcrumbs
  const breadcrumbStructuredData = showStructuredData ? generateBreadcrumbStructuredData(breadcrumbs) : null;

  // Don't show breadcrumbs if we're on the home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <>
      {/* Structured Data */}
      {breadcrumbStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbStructuredData)}
        </script>
      )}

      {/* Breadcrumb Navigation */}
      <nav 
        className={`flex items-center space-x-2 text-sm text-gray-600 mb-6 ${className}`}
        aria-label="Breadcrumb"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = breadcrumb.name === 'Home';

          return (
            <React.Fragment key={breadcrumb.url}>
              {index > 0 && (
                <FaChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
              
              {isLast ? (
                // Current page (not clickable)
                <span 
                  className={`font-medium ${
                    isHome ? 'text-gray-500' : 'text-gray-900'
                  }`}
                  aria-current="page"
                >
                  {isHome ? (
                    <span className="flex items-center">
                      <FaHome className="w-4 h-4 mr-1" />
                      {breadcrumb.name}
                    </span>
                  ) : (
                    breadcrumb.name
                  )}
                </span>
              ) : (
                // Clickable breadcrumb
                <Link
                  to={breadcrumb.url}
                  className={`hover:text-primary-600 transition-colors duration-200 ${
                    isHome ? 'flex items-center' : ''
                  }`}
                >
                  {isHome ? (
                    <>
                      <FaHome className="w-4 h-4 mr-1" />
                      {breadcrumb.name}
                    </>
                  ) : (
                    breadcrumb.name
                  )}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};

/**
 * BreadcrumbPageWrapper - Wrapper component that includes breadcrumbs and SEO
 */
interface BreadcrumbPageWrapperProps {
  title: string;
  description: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  children: React.ReactNode;
  className?: string;
}

export const BreadcrumbPageWrapper: React.FC<BreadcrumbPageWrapperProps> = ({
  title,
  description,
  breadcrumbs,
  children,
  className = ''
}) => {
  return (
    <>
      <SEOHead
        title={title}
        description={description}
        canonical={window.location.pathname}
      />
      <div className={`min-h-screen bg-gray-50 pt-16 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs customBreadcrumbs={breadcrumbs} />
          {children}
        </div>
      </div>
    </>
  );
};

export default Breadcrumbs;
