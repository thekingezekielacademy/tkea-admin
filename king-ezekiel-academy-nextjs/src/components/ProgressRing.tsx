import React from 'react';

type ProgressRingProps = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 - 100
  className?: string;
};

const ProgressRing: React.FC<ProgressRingProps> = ({ size = 64, strokeWidth = 6, progress, className }) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="#10b981"
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            strokeDasharray: `${dash} ${circumference - dash}`,
            transition: 'stroke-dasharray 300ms ease',
          }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={Math.max(12, size * 0.28)}
          fill="#111827"
          fontWeight={700}
        >
          {Math.round(clamped)}%
        </text>
      </svg>
    </div>
  );
};

export default ProgressRing;
