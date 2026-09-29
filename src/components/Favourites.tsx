import { Heart } from 'lucide-react';
import { Filter } from '@/supabase/schema';
import { cn } from '@/utils/cnUtils';

interface FavouritesProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
}

const Favourites = ({ onFilterChange, activeFilters }: FavouritesProps) => {
  const isActive = activeFilters.category === 'favourites';
  const handleFavouriteClick = () => {
    if (isActive) {
      onFilterChange({ ...activeFilters, category: undefined });
    } else {
      onFilterChange({ ...activeFilters, category: 'favourites' });
    }
  };
  return (
    <button
      aria-label="Favourites only"
      aria-pressed={isActive}
      onClick={handleFavouriteClick}
      className={cn(
        'flex items-center rounded-full p-3 shadow-lg',
        isActive ? 'bg-primary text-white' : 'bg-white text-gray-700',
      )}
    >
      <Heart />
    </button>
  );
};

export default Favourites;