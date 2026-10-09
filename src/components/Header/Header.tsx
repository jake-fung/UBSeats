import { MapPin, Search } from 'lucide-react';

import { cn } from '@/utils/cnUtils';
import SearchBar from '@/components/SearchBar';
import SearchField from '@/components/SearchField';

interface HeaderProps {
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  onSearchIconClicked?: () => void;
  onClearSearch?: () => void;
  isMobile?: boolean;
  isMenuOpened?: boolean;
  desktopShift?: boolean;
  showSearch?: boolean;
  customWrapperCss?: string;
}

const Header = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSearchIconClicked,
  onClearSearch,
  isMobile,
  isMenuOpened,
  desktopShift = false,
  showSearch,
  customWrapperCss,
}: HeaderProps) => {
  const shouldShowSearch = showSearch && !isMenuOpened;
  const mobileMenuOpened = !!(isMobile && isMenuOpened);
  const collapseNav = desktopShift || mobileMenuOpened;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchSubmit?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-5 left-[5vw] z-10 h-16.5 w-[90vw] rounded-full bg-white px-4 py-2 shadow-soft backdrop-blur-md transition-all duration-300 md:px-8 md:py-3',
          customWrapperCss,
        )}
      >
        <div className="flex h-full w-full items-center justify-between px-3">
          <div className="flex items-center">
            <MapPin className="mr-2 h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">UBSeats</h1>
          </div>

          {!collapseNav && (
            <div className="flex items-center md:space-x-8">
              {!isMobile && (
                <SearchField
                  value={searchQuery}
                  onChange={handleInputChange}
                  onSubmit={handleSearchSubmit}
                  onClear={onClearSearch}
                  className="w-[40vw]"
                />
              )}

              {isMobile && (
                <button
                  type="button"
                  aria-expanded={shouldShowSearch}
                  onClick={onSearchIconClicked}
                  className={cn('h-6 w-6 transition-colors', shouldShowSearch ? 'text-primary' : 'text-gray-700')}
                  aria-label="Search"
                >
                  <Search aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {isMobile && (
        <SearchBar
          searchQuery={searchQuery}
          collapseNav={collapseNav}
          showSearch={shouldShowSearch}
          onInputChange={handleInputChange}
          onSubmit={handleSearchSubmit}
          onClear={onClearSearch}
        />
      )}
    </>
  );
};

export default Header;
