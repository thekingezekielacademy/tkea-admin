'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
}

const OptimizedLink: React.FC<OptimizedLinkProps> = ({ 
  href, 
  children, 
  className = '', 
  onClick,
  prefetch = true 
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (isNavigating) {
      e.preventDefault();
      return;
    }

    setIsNavigating(true);
    
    if (onClick) {
      onClick();
    }

    // Use router.push for faster navigation
    router.push(href);
    
    // Reset navigation state after a short delay
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <Link
      href={href}
      className={`${className} ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {isNavigating ? 'Loading...' : children}
    </Link>
  );
};

export default OptimizedLink;
