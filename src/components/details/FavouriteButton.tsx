import { Heart } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useFavourites } from '@/hooks/useFavourites';

interface FavouriteButtonProps {
  roomUuid: string;
  roomName: string;
}

export const FavouriteButton = ({ roomUuid, roomName }: FavouriteButtonProps) => {
  const { favourites, toggle } = useFavourites();
  const favourited = favourites.has(roomUuid);

  return (
    <button
      type="button"
      aria-pressed={favourited}
      aria-label={favourited ? `Remove ${roomName} from favourites` : `Add ${roomName} to favourites`}
      onClick={(e) => {
        e.stopPropagation();
        toggle(roomUuid);
      }}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-primary"
    >
      <Heart className={cn('h-4 w-4 transition-all', favourited && 'fill-primary text-primary')} />
    </button>
  );
};
