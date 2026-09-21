import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-[#171421] border border-[#292332]/40 rounded-xl ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[#11101A] border border-[#292332] rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[#1F1A28] rounded w-1/3"></div>
        <div className="h-4 bg-[#1F1A28] rounded w-12"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-[#171421] rounded w-full"></div>
        <div className="h-3 bg-[#171421] rounded w-4/5"></div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[#1F1A28]">
        <div className="h-5 bg-[#1F1A28] rounded-md w-16"></div>
        <div className="h-5 bg-[#1F1A28] rounded-md w-20"></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 py-3.5 px-4 bg-[#11101A] border-b border-[#1F1A28] animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-[#1F1A28] rounded ${i === 0 ? 'w-1/3' : 'w-1/4'}`}
        />
      ))}
    </div>
  );
}
