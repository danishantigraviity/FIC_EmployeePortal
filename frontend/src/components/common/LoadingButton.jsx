import React from 'react';

export default function LoadingButton({ 
  children, 
  loading, 
  disabled, 
  className = "", 
  type = "submit", 
  onClick, 
  variant = "primary",
  style = {}
}) {
  const baseStyles = "relative flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-br from-[#0D2B6B] to-[#1A4FA0] text-white shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    warning: "bg-[#F5C518] text-[#0D2B6B] hover:brightness-105"
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      style={style}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </span>
      )}
    </button>
  );
}
