import { useState } from 'react';
import { FilterIcon, MapPin, Search, X } from 'lucide-react';

import SearchBar from '@/components/SearchBar';
import { cn } from '@/utils/cnUtils';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  onSearchIconClicked?: () => void;
  onFilterIconClicked?: () => void;
  isMobile?: boolean;
  desktopShift?: boolean;
  showSearch?: boolean;
  customWrapperCss?: string;
}

const Header = ({
  onSearchChange,
  onSearchSubmit,
  onSearchIconClicked,
  onFilterIconClicked,
  isMobile,
  desktopShift = false,
  showSearch,
  customWrapperCss,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchSubmit?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearchChange?.('');
  };

  return (
    <>
      <header
        className={cn(
          'fixed left-[5vw] top-3 z-10 h-[66px] w-[90vw] rounded-full bg-white px-4 py-2 shadow-soft backdrop-blur-md transition-all duration-300 md:left-[10vw] md:top-5 md:w-[80vw] md:px-8 md:py-3',
          customWrapperCss,
        )}
      >
        <div className="flex h-full w-full items-center justify-between px-3">
          <div className="flex items-center">
            <MapPin className="mr-2 h-6 w-6 text-primary" />
            <div className="text-xl font-semibold tracking-tight text-gray-900">UBSeats</div>
          </div>

          {!desktopShift && (
            <nav className="flex items-center md:space-x-8">
              {!isMobile && (
                <form className="relative" onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search by building name/code..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    className="w-[40vw] rounded-full border border-transparent bg-gray-100 py-2 pl-10 pr-4 outline-none transition-all focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  {searchQuery && (
                    <X
                      className="absolute right-3 top-2.5 h-5 w-5 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                      onClick={handleClearSearch}
                    />
                  )}
                </form>
              )}

              {isMobile && (
                <button
                  onClick={onSearchIconClicked}
                  className={cn('h-6 w-6 transition-colors', showSearch ? 'text-primary' : 'text-gray-700')}
                  aria-label="Search"
                >
                  <Search />
                </button>
              )}

              {!isMobile && (
                <button
                  onClick={onFilterIconClicked}
                  className="h-6 w-6 text-gray-700 transition-colors hover:text-primary"
                  aria-label="Toggle filter bar"
                >
                  <FilterIcon />
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      {isMobile && (
        <SearchBar
          searchQuery={searchQuery}
          showSearch={showSearch}
          onInputChange={handleInputChange}
          onSubmit={handleSearchSubmit}
          onClear={handleClearSearch}
        />
      )}
    </>
  );
};

export default Header;
