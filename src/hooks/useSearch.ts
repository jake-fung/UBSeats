import { useState } from 'react';
import type { Building } from '@/supabase/schema/types';

// Single home for the search matching logic (moved out of useBuildings).
export const filterBuildingsBySearch = (buildings: Building[], query?: string): Building[] => {
  const q = query?.trim().toLowerCase();
  if (!q) return buildings;
  return buildings.filter(
    (building) => building.name.toLowerCase().includes(q) || building.code.toLowerCase().includes(q),
  );
};

interface UseSearchOptions {
  onQueryChange?: (query: string) => void; // react to typing/clearing (clear selection, close menu)
  onSubmit?: (query: string) => void; // form submit (select building if exactly 1 match)
  onToggle?: (isOpen: boolean) => void; // search visibility toggled (filter bar, clear selection)
}

export const useSearch = (options?: UseSearchOptions) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    options?.onQueryChange?.(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    options?.onQueryChange?.('');
  };

  const handleSearchSubmit = () => {
    options?.onSubmit?.(searchQuery);
  };

  const handleSearchIconClicked = () => {
    setShowSearch((prev) => {
      const next = !prev;
      options?.onToggle?.(next);
      return next;
    });
  };

  return {
    searchQuery,
    showSearch,
    setShowSearch,
    handleSearchChange,
    handleClearSearch,
    handleSearchSubmit,
    handleSearchIconClicked,
  };
};
