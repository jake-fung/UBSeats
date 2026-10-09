import { cn } from '@/utils/cnUtils';
import SearchField from '@/components/SearchField';

interface SearchBarProps {
  searchQuery: string;
  showSearch?: boolean;
  collapseNav: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
}

const SearchBar = ({ searchQuery, collapseNav, showSearch, onInputChange, onSubmit, onClear }: SearchBarProps) => {
  return (
    <div
      className={cn(
        'absolute top-12 left-[5vw] rounded-b-4xl bg-white px-4 py-2 shadow-soft backdrop-blur-md transition-all duration-300',
        collapseNav ? 'w-0' : 'w-[90vw]',
      )}
    >
      <div
        inert={!showSearch}
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          showSearch ? 'mt-10 grid-rows-[1fr] opacity-100' : 'h-0 grid-rows-[0fr] opacity-0',
        )}
      >
        <SearchField value={searchQuery} onChange={onInputChange} onSubmit={onSubmit} onClear={onClear} />
      </div>
    </div>
  );
};

export default SearchBar;
