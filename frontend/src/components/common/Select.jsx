import { useState, useRef, useEffect, memo } from 'react';

const Select = memo(({ label, value, options, onChange, placeholder = 'Select option', disabled = false, className = '', variant = 'default' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  const isCompact = variant === 'compact';

  return (
    <div className={`relative group ${className}`} ref={containerRef}>
      {label && !isCompact && (
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest transition group-hover:text-blue-600 mb-1.5 ml-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
          if (e.key === 'Escape') setIsOpen(false);
        }}
        className={`w-full flex items-center justify-between cursor-pointer transition-all duration-300 rounded-[10px] bg-white border ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-100' : 
          isOpen ? 'border-blue-500 ring-4 ring-blue-50 shadow-md' : 
          'border-slate-200 hover:border-blue-400 hover:shadow-sm'
        } ${isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-3 text-sm font-medium'}`}
      >
        <span className={`${!value ? 'text-slate-400' : 'text-slate-700 font-semibold'} truncate`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-[100] mt-2 bg-white border border-slate-100 rounded-[10px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
          isCompact ? 'w-48 right-0' : 'w-full min-w-[200px]'
        }`}>
          {options.length > 8 && (
            <div className="px-3 pb-2 pt-1 border-b border-slate-50 mb-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isActive = value === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-[13px] cursor-pointer transition-all flex items-center justify-between mx-1 rounded-lg mb-0.5 last:mb-1 mt-1 ${
                      isActive 
                        ? 'bg-blue-600 text-white font-bold shadow-sm' 
                        : 'text-slate-600 font-medium hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isActive && (
                       <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No results</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default Select;
