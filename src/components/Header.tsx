import React, { useState } from 'react';
import { FilterIcon, MapPin, Menu, Search, X } from 'lucide-react';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onFilterIconClicked?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchChange, onFilterIconClicked }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchQuery);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="fixed left-[10%] top-5 z-50 w-[80vw] rounded-full bg-white shadow-soft backdrop-blur-md transition-all duration-300 ease-in-out md:px-8 md:py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center">
          <MapPin className="mr-2 h-6 w-6 text-primary" />
          <a href="#root" className="text-xl font-semibold tracking-tight text-gray-900">
            UBSeats
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="flex items-center text-gray-700 transition-colors hover:text-primary md:hidden"
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden items-center space-x-8 md:flex">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Find study spots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-full border border-transparent bg-gray-100 py-2 pl-10 pr-4 outline-none transition-all focus:w-[50vw] focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searchQuery && (
              <X
                className="absolute right-3 top-2.5 h-5 w-5 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                onClick={() => {
                  setSearchQuery('');
                  onSearchChange?.('');
                }}
              />
            )}
          </form>

          <button
            onClick={() => onFilterIconClicked?.()}
            className="h-6 w-6 text-gray-700 transition-colors hover:text-primary"
          >
            <FilterIcon />
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="slide-up absolute left-0 right-0 top-16 rounded-b-lg bg-white p-4 shadow-lg md:hidden">
          <nav className="flex flex-col space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Find study spots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-transparent bg-gray-100 py-2 pl-10 pr-4 outline-none transition-all focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>

            <a
              href="#spots"
              onClick={toggleMenu}
              className="px-2 py-1 font-bold text-gray-700 transition-colors hover:text-primary"
            >
              Spots
            </a>
            <a
              href="#map"
              onClick={toggleMenu}
              className="px-2 py-1 font-bold text-gray-700 transition-colors hover:text-primary"
            >
              Map
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
