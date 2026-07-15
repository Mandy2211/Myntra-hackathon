import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  allowOthers = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (allowOthers) {
    filteredOptions.push({ value: 'OTHERS', label: 'Others' });
  }

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = value === 'OTHERS' ? 'Others' : (selectedOption ? selectedOption.label : '');

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus-within:border-pink-500 rounded-xl py-2.5 px-3 text-xs flex justify-between items-center cursor-pointer transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={displayValue ? "text-slate-100" : "text-slate-400"}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700/60 rounded-xl shadow-lg shadow-pink-500/10 overflow-hidden">
          <div className="p-2 border-b border-slate-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text"
              className="w-full bg-transparent text-xs text-slate-100 focus:outline-none"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <div 
                  key={`${option.value}-${idx}`}
                  className="px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer transition-colors"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-slate-500 text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
