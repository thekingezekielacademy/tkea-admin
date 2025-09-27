import React from 'react';
import SEOHead from './SEOHead';

interface Breadcrumb {
  name: string;
  url: string;
}

interface BreadcrumbPageWrapperProps {
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
  children: React.ReactNode;
}

const BreadcrumbPageWrapper: React.FC<BreadcrumbPageWrapperProps> = ({
  title,
  description,
  breadcrumbs,
  children
}) => {
  return (
    <>
      <SEOHead
        title={title}
        description={description}
        canonical={breadcrumbs[breadcrumbs.length - 1]?.url || '/'}
      />
      {children}
    </>
  );
};

export { BreadcrumbPageWrapper };
