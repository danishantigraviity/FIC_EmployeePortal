import React from 'react';

export default function SkeletonLoader({ type = 'rect', className = "", count = 1 }) {
  const baseClass = "bg-slate-200 animate-pulse rounded-lg";
  
  const types = {
    rect: "h-24 w-full",
    circle: "h-12 w-12 rounded-full",
    text: "h-4 w-3/4",
    title: "h-8 w-1/2 mb-4",
    card: "h-48 w-full",
    avatar: "h-10 w-10 rounded-xl"
  };

  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <div 
          key={i} 
          className={`${baseClass} ${types[type]} ${className}`} 
        />
      ))}
    </>
  );
}
