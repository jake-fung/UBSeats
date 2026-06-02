import { Search, X } from 'lucide-react';

import { cn } from '@/utils/cnUtils';

interface SearchBarProps {
  searchQuery: string;
  showSearch?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

const SearchBar = ({ searchQuery, showSearch, onInputChange, onSubmit, onClear }: SearchBarProps) => {
  return (
    <div className="absolute left-[5vw] top-12 w-[90vw] rounded-b-[32px] bg-white px-4 py-2 shadow-soft backdrop-blur-md transition-all duration-300">
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          showSearch ? 'mt-8 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <form className="relative overflow-hidden" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Search by building name/code..."
            value={searchQuery}
            onChange={onInputChange}
            className="w-[80vw] rounded-full border border-transparent bg-gray-100 py-2 pl-10 pr-4 outline-none transition-all focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          {searchQuery && (
            <X
              className="absolute right-3 top-2.5 h-5 w-5 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
              onClick={onClear}
            />
          )}
        </form>
      </div>
    </div>
  );
};

export default SearchBar;
