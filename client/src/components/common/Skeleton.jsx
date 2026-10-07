import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`}
      {...props}
    />
  );
};

export const ThreadListSkeleton = ({ count = 5 }) => {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
};

export const ChatMessageSkeleton = ({ count = 4 }) => {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex gap-3 max-w-md ${i % 2 === 1 ? 'ml-auto flex-row-reverse' : ''}`}
        >
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton
              className={`h-12 w-full rounded-2xl ${
                i % 2 === 1 ? 'bg-indigo-100/70' : 'bg-slate-200/80'
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
