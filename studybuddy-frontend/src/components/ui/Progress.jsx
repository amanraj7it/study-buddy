import React from 'react';
import { motion } from 'framer-motion';

export function ProgressBar({
  value = 0,
  max = 100,
  height = 'h-2',
  color = 'bg-[#8B5CF6]',
  className = '',
  showLabel = false,
}) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[#8F889D]">
          <span>Progress</span>
          <span className="font-medium text-[#F5F3F7]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-[#1F1A28] rounded-full overflow-hidden ${height}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`${height} rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export function ProgressRing({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = '#8B5CF6',
  trackColor = '#1F1A28',
  children,
}) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated indicator */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children || <span className="text-sm font-bold text-[#F5F3F7]">{Math.round(percentage)}%</span>}
      </div>
    </div>
  );
}
