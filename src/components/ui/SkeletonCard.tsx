import React from 'react';

interface SkeletonProps {
  className?: string;
  type?: 'card' | 'list-item' | 'insight' | 'chart' | 'budget';
}

export function SkeletonCard({ className = '', type = 'card' }: SkeletonProps) {
  if (type === 'list-item') {
    return (
      <div className={`w-full bg-white border border-[#E8E8E8] rounded-2xl p-4 flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-full animate-shimmer shrink-0" />
          <div className="space-y-2 w-1/3">
            <div className="h-3 w-full rounded animate-shimmer" />
            <div className="h-2 w-2/3 rounded animate-shimmer" />
          </div>
        </div>
        <div className="space-y-2 w-16 flex flex-col items-end">
          <div className="h-3 w-full rounded animate-shimmer" />
          <div className="h-2 w-1/2 rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  if (type === 'insight') {
    return (
      <div className={`bg-white border border-[#E8E8E8] rounded-2xl p-5 space-y-3 ${className}`}>
        <div className="h-3.5 w-1/3 rounded animate-shimmer" />
        <div className="h-6 w-1/2 rounded animate-shimmer" />
        <div className="h-2.5 w-2/3 rounded animate-shimmer" />
      </div>
    );
  }

  if (type === 'budget') {
    return (
      <div className={`bg-white border border-[#E8E8E8] rounded-2xl p-6 space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="space-y-2 w-1/2">
            <div className="h-2.5 w-3/4 rounded animate-shimmer" />
            <div className="h-4 w-1/2 rounded animate-shimmer" />
          </div>
          <div className="h-5 w-16 rounded-full animate-shimmer" />
        </div>
        <div className="h-2.5 w-full rounded-full animate-shimmer" />
        <div className="flex justify-between w-full">
          <div className="h-2.5 w-1/4 rounded animate-shimmer" />
          <div className="h-2.5 w-1/4 rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`bg-white border border-[#E8E8E8] rounded-2xl p-6 space-y-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-3 w-1/4 rounded animate-shimmer" />
          <div className="h-3 w-12 rounded animate-shimmer" />
        </div>
        <div className="h-48 w-full flex items-end gap-3 pt-4">
          <div className="w-full h-1/4 rounded animate-shimmer" />
          <div className="w-full h-1/2 rounded animate-shimmer" />
          <div className="w-full h-2/3 rounded animate-shimmer" />
          <div className="w-full h-1/3 rounded animate-shimmer" />
          <div className="w-full h-3/4 rounded animate-shimmer" />
          <div className="w-full h-5/6 rounded animate-shimmer" />
          <div className="w-full h-2/5 rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#E8E8E8] rounded-3xl p-6 space-y-4 ${className}`}>
      <div className="h-3 w-1/4 rounded animate-shimmer" />
      <div className="h-8 w-2/3 rounded animate-shimmer" />
      <div className="h-2.5 w-1/2 rounded animate-shimmer" />
    </div>
  );
}

export function SkeletonList({ count = 3, type = 'list-item', className = '' }: { count?: number; type?: 'card' | 'list-item' | 'insight' | 'chart' | 'budget'; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} type={type} />
      ))}
    </div>
  );
}
