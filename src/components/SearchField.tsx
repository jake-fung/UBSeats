import { useId } from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/utils/cnUtils';

interface SearchFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  className?: string;
}

/** Building search: labelled input, decorative search icon, and a real clear button. */
const SearchField = ({ value, onChange, onSubmit, onClear, className }: SearchFieldProps) => {
  const id = useId();
  return (
    <form role="search" className={cn('relative', className)} onSubmit={onSubmit}>
      <label htmlFor={id} className="sr-only">
        Search buildings
      </label>
      <input
        id={id}
        type="search"
        placeholder="Search by building name/code..."
        value={value}
        onChange={onChange}
        className="w-full rounded-full border border-transparent bg-gray-100 py-2 pr-10 pl-10 transition-all focus:border-gray-300 focus:bg-white [&::-webkit-search-cancel-button]:hidden"
      />
      <Search className="pointer-events-none absolute top-2.5 left-3 h-5 w-5 text-gray-400" aria-hidden="true" />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="absolute top-1.5 right-1.5 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </form>
  );
};

export default SearchField;
