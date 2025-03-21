import React, { useEffect, useState } from "react";
import { MapPin, Menu, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onSearchChange?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchChange }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

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
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-5 px-6 md:px-8",
        scrolled ? "bg-white backdrop-blur-md shadow-soft" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <MapPin className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            UBSeats
          </h1>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex items-center text-gray-700 hover:text-primary transition-colors"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Find study spots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full bg-gray-100 border border-transparent focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>

          <a
            href="#spots"
            className="text-gray-700 hover:text-primary transition-colors font-bold"
          >
            Spots
          </a>
          <a
            href="#map"
            className="text-gray-700 hover:text-primary transition-colors font-bold"
          >
            Map
          </a>
          <a
            href="#reviews"
            className="text-gray-700 hover:text-primary transition-colors font-bold"
          >
            Reviews
          </a>

          <button className="rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 transition-colors">
            <User className="h-5 w-5" />
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg rounded-b-lg p-4 slide-up">
          <nav className="flex flex-col space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Find study spots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full bg-gray-100 border border-transparent focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none w-full"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>

            <a
              href="#spots"
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary transition-colors font-bold px-2 py-1"
            >
              Spots
            </a>
            <a
              href="#map"
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary transition-colors font-bold px-2 py-1"
            >
              Map
            </a>
            <a
              href="#reviews"
              onClick={toggleMenu}
              className="text-gray-700 hover:text-primary transition-colors font-bold px-2 py-1"
            >
              Reviews
            </a>

            <button className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium px-2 py-1">
              <User className="h-5 w-5 mr-2" />
              <span>Profile</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
