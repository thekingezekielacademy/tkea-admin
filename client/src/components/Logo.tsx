import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizeMap = {
    sm: { logo: 24, text: 'text-sm' },
    md: { logo: 32, text: 'text-base' },
    lg: { logo: 48, text: 'text-lg' },
    xl: { logo: 64, text: 'text-xl' }
  };

  const { logo: logoSize, text: textSize } = sizeMap[size];

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
      
      {/* Academy Name */}
      {showText && (
        <div className={`flex flex-col font-bold text-blue-900 ${textSize} leading-tight`}>
          <span>The King</span>
          <span>Ezekiel</span>
          <span>Academy</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
