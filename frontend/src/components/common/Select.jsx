import { useState, useRef, useEffect, memo } from 'react';

const Select = memo(({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = 'Select option', 
  disabled = false, 
  className = '', 
  variant = 'default',
  isSearchable = true
}) => {
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
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] transition group-hover:text-blue-600 mb-2 ml-1">
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
        className={`w-full flex items-center justify-between cursor-pointer transition-all duration-300 rounded-xl bg-white border ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50' : 
          isOpen ? 'border-blue-500 ring-4 ring-blue-50/40 shadow-sm' : 
          'border-slate-200 hover:border-slate-300'
        } ${isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm font-medium'}`}
      >
        <span className={`${!value ? 'text-slate-400' : 'text-slate-700'} truncate`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`ml-2 transition-transform duration-500 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-[100] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top ${
          isCompact ? 'w-56 right-0' : 'w-full min-w-[220px]'
        }`}>
          {isSearchable && options.length > 5 && (
            <div className="px-3 pb-2 pt-2 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter departments..."
                  className="w-full bg-slate-50/80 border border-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-600 focus:bg-white focus:border-blue-300 focus:ring-0 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
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
                    className={`group/opt px-3 py-2 text-xs cursor-pointer transition-all flex items-center justify-between rounded-lg mb-0.5 last:mb-0 ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 font-bold' 
                        : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isActive ? (
                       <svg className="w-3.5 h-3.5 text-blue-600 animate-in zoom-in duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-slate-300 opacity-0 group-hover/opt:opacity-100 transition-all -translate-x-1 group-hover/opt:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching options</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default Select;
