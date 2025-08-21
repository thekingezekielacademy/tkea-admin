import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = false, className = '' }) => {
  const sizeMap = {
    sm: { logo: 24 },
    md: { logo: 32 },
    lg: { logo: 48 },
    xl: { logo: 64 },
    '2xl': { logo: 80 }
  };

  const { logo: logoSize } = sizeMap[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* KEA Logo */}
      <div className="flex-shrink-0">
        <svg
          width={logoSize}
          height={logoSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* K - Orange letter */}
          <path
            d="M8 8h8l12 16-12 16H8V8z"
            fill="#FF6B35"
          />
          <path
            d="M8 32l8-8h8l-8 8 8 8h-8l-8-8z"
            fill="#FF6B35"
          />
          
          {/* E - Three horizontal orange bars */}
          <rect x="20" y="8" width="16" height="6" fill="#FF6B35" rx="1" />
          <rect x="20" y="29" width="16" height="6" fill="#FF6B35" rx="1" />
          <rect x="20" y="50" width="16" height="6" fill="#FF6B35" rx="1" />
          
          {/* A - Orange triangle with blue inner triangle */}
          <path
            d="M44 8l16 48H44L44 8z"
            fill="#FF6B35"
          />
          <path
            d="M48 16l12 36H48L48 16z"
            fill="#1E3A8A"
          />
        </svg>
      </div>
      

    </div>
  );
};

export default Logo;
