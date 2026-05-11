import React from 'react';

/**
 * Premium Forge India Loader
 * A smooth, animated loading spinner using brand colors and modern CSS.
 */
const Loader = ({ message = 'Loading...', fullPage = false, size = 'md' }) => {
  const sizeMap = {
    sm: { container: 'w-8 h-8', outer: 'border-2', inner: 'inset-1.5 border-2' },
    md: { container: 'w-14 h-14', outer: 'border-4', inner: 'inset-2.5 border-4' },
    lg: { container: 'w-20 h-20', outer: 'border-[6px]', inner: 'inset-4 border-[6px]' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className="loader-container">
      <div className={`loader-ring ${currentSize.container}`}>
        <div className={`loader-ring-outer ${currentSize.outer} loader-glow`} />
        <div className={`loader-ring-inner ${currentSize.inner}`} />
      </div>
      {message && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-sm font-bold text-slate-800 tracking-wide uppercase font-poppins animate-pulse">
            {message}
          </p>
          <div className="flex gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
