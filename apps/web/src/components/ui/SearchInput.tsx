import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
        size={18}
      />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all duration-150 shadow-soft"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
