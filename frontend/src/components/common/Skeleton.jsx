import React from 'react';

const Skeleton = ({ className, width, height, circle }) => {
  const style = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: circle ? '50%' : '8px',
  };

  return (
    <div 
      className={`animate-pulse bg-slate-200 ${className}`} 
      style={style}
    />
  );
};

export const SkeletonText = ({ lines = 3, gap = '10px' }) => (
  <div className="space-y-2" style={{ gap }}>
    {[...Array(lines)].map((_, i) => (
      <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height="12px" />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton width="48px" height="48px" circle />
      <div className="space-y-2 flex-1">
        <Skeleton width="40%" height="16px" />
        <Skeleton width="25%" height="10px" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export default Skeleton;
