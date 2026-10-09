import { Heart } from 'lucide-react';
import { Filter } from '@/supabase/schema';
import { RoundButton } from '@/components/ui/round-button';

interface FavouritesProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
}

const Favourites = ({ onFilterChange, activeFilters }: FavouritesProps) => {
  const isActive = activeFilters.category === 'favourites';
  const handleFavouriteClick = () => {
    onFilterChange({ ...activeFilters, category: isActive ? undefined : 'favourites' });
  };
  return (
    <RoundButton label="Favourites only" pressed={isActive} onClick={handleFavouriteClick}>
      <Heart aria-hidden="true" />
    </RoundButton>
  );
};

export default Favourites;
