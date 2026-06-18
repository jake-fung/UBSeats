import { Room } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CategoryTags } from '@/components/details/CategoryTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';

interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white/70 shadow-lg sm:flex-row">
      {room.image && (
        <img
          className="aspect-video w-full shrink-0 object-cover sm:aspect-square sm:w-28"
          src={room.image}
          alt={room.name}
          loading="lazy"
        />
      )}
      <div className="flex flex-1 items-center justify-between px-5 py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <CategoryTags categoryIds={room.categoryIds} />
            <NoteTags notes={room.notes} />
          </div>
          <h4 className="my-1 text-base font-semibold text-gray-900">{room.name}</h4>
          <CapacityRow capacity={room.capacity} />
        </div>
        <ViewSpaceButton link={room.link} />
      </div>
    </div>
  );
};
