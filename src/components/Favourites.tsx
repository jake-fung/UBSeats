import { Heart } from 'lucide-react';
import { Filter } from '@/supabase/schema/types';

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
    <>
      <div className={`fixed bottom-6 left-34 z-10 flex flex-row gap-3 rounded-full p-3 shadow-lg ${isActive ? 'bg-primary text-white' : 'bg-white'}`}>
        <button className="rounded" onClick={handleFavouriteClick}>
          <Heart />
        </button>
      </div>
    </>
  );
};

export default Favourites;