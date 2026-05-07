import { useState, useRef, useEffect, memo } from 'react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DatePicker = memo(({ label, value, onChange, disabled, max }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevPadding = Array.from({ length: firstDay }, (_, i) => prevMonthDays - firstDay + i + 1);
  const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const nextPadding = Array.from({ length: 42 - prevPadding.length - currentDays.length }, (_, i) => i + 1);

  const handleSelect = (d) => {
    const selected = new Date(year, month, d);
    onChange(selected.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const isToday = (d) => {
    const today = new Date();
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (d) => {
    if (!value) return false;
    const s = new Date(value);
    return d === s.getDate() && month === s.getMonth() && year === s.getFullYear();
  };

  const handleYearChange = (offset) => {
    setViewDate(new Date(year + offset, month, 1));
  };

  return (
    <div className="relative group" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest transition group-hover:text-blue-600 mb-1.5 ml-1">
          {label}
        </label>
      )}
      
      <div className={`w-full px-4 py-3 text-sm font-medium flex items-center justify-between cursor-pointer transition-all duration-300 rounded-2xl ${
        disabled ? 'bg-slate-50 cursor-not-allowed text-slate-400 border-slate-100' : 
        isOpen ? 'bg-white border-blue-600 ring-4 ring-blue-50 shadow-md' : 
        'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      } border`}>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              const d = new Date(val);
              if (!isNaN(d.getTime())) setViewDate(d);
            }
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder="YYYY-MM-DD"
          disabled={disabled}
          className="bg-transparent border-none outline-none w-full text-slate-700 font-semibold placeholder:text-slate-300"
        />
        <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`cursor-pointer transition-colors text-[10px] font-black uppercase tracking-widest ${isOpen ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}>
          Select
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-100 p-5 w-[320px] left-0 transform origin-top transition-all animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button type="button" onClick={() => handleYearChange(-1)} className="px-2 py-1 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition font-black text-xs">
                {"<<"}
              </button>
              <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="px-2 py-1 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition font-black text-xs">
                {"<"}
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-base font-poppins font-black text-slate-800 tracking-tight">{MONTHS[month]}</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">{year}</span>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="px-2 py-1 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition font-black text-xs">
                {">"}
              </button>
              <button type="button" onClick={() => handleYearChange(1)} className="px-2 py-1 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition font-black text-xs">
                {">>"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {DAYS.map(d => <div key={d} className="text-[10px] font-black text-slate-300 text-center uppercase tracking-widest">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {prevPadding.map(d => <div key={`p-${d}`} className="h-9 flex items-center justify-center text-[11px] text-slate-200 font-medium">{d}</div>)}
            {currentDays.map(d => {
              const active = isSelected(d);
              const today = isToday(d);
              const dateObj = new Date(year, month, d);
              const isDisabled = max && dateObj > new Date(max);

              return (
                <div key={d} 
                  onClick={() => !isDisabled && handleSelect(d)}
                  className={`h-9 flex items-center justify-center text-[13px] rounded-xl transition-all duration-200 ${
                    isDisabled ? 'text-slate-100 cursor-not-allowed' :
                    active ? 'bg-blue-600 text-white font-bold shadow-md' : 
                    today ? 'bg-blue-50 text-blue-600 font-bold' : 
                    'text-slate-600 font-medium hover:bg-slate-50 hover:text-blue-600 cursor-pointer'
                  }`}>
                  {d}
                </div>
              );
            })}
            {nextPadding.map(d => <div key={`n-${d}`} className="h-9 flex items-center justify-center text-[11px] text-slate-200 font-medium">{d}</div>)}
          </div>
          
          <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
            <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">Clear</button>
            <button type="button" 
              disabled={max && new Date().setHours(0,0,0,0) > new Date(max).setHours(0,0,0,0)}
              onClick={() => { setViewDate(new Date()); handleSelect(new Date().getDate()); }} 
              className="px-5 py-2 bg-[#F5C518] text-[#0D2B6B] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-105 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-yellow-600/10">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default DatePicker;
