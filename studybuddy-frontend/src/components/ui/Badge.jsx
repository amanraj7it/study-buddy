import React from 'react';

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  color, // optional custom hex color for subjects
}) {
  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    default: 'bg-[#171421] text-[#8F889D] border border-[#292332]',
    primary: 'bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30',
    high: 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30 font-semibold',
    medium: 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30',
    low: 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30',
    completed: 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30',
    in_progress: 'bg-[#60A5FA]/15 text-[#60A5FA] border border-[#60A5FA]/30',
    pending: 'bg-[#8F889D]/15 text-[#8F889D] border border-[#8F889D]/30',
    active: 'bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30',
  };

  if (color) {
    return (
      <span
        style={{
          backgroundColor: `${color}1A`,
          color: color,
          borderColor: `${color}4D`,
        }}
        className={`inline-flex items-center gap-1 font-medium rounded-md border ${sizeStyles[size] || sizeStyles.sm} ${className}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md ${
        sizeStyles[size] || sizeStyles.sm
      } ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
