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
        className={`w-full flex items-center justify-between cursor-pointer transition-all duration-300 rounded-2xl bg-white border-2 ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50' : 
          isOpen ? 'border-blue-500 ring-4 ring-blue-50/50 shadow-lg shadow-blue-500/5' : 
          'border-slate-50 hover:border-blue-400 hover:shadow-md'
        } ${isCompact ? 'px-3 py-2 text-xs border-slate-100' : 'px-5 py-3.5 text-sm font-semibold'}`}
      >
        <span className={`${!value ? 'text-slate-400' : 'text-slate-700'} truncate`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`ml-2 transition-transform duration-500 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-300 group-hover:text-blue-400'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className={`absolute z-[100] mt-2 bg-white border border-slate-100 rounded-[1.25rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top ${
          isCompact ? 'w-56 right-0' : 'w-full min-w-[240px]'
        }`}>
          {isSearchable && options.length > 5 && (
            <div className="px-3 pb-2 pt-3 border-b border-slate-50 mb-1 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
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
                    className={`group/opt px-4 py-3 text-[13px] cursor-pointer transition-all flex items-center justify-between rounded-xl mb-1 last:mb-0 ${
                      isActive 
                        ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20' 
                        : 'text-slate-600 font-bold hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isActive ? (
                       <svg className="w-4 h-4 text-white animate-in zoom-in duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover/opt:opacity-100 transition-all -translate-x-2 group-hover/opt:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="text-slate-200 mb-2 flex justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default Select;
