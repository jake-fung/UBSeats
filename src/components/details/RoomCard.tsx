import { Room } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CategoryTags } from '@/components/details/CategoryTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';
import { RoomTimetable } from '@/components/details/RoomTimetable';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';

interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const availability = useRoomAvailability(room.uuid);

  return (
    <div className="flex cursor-pointer flex-col rounded-2xl bg-white/70 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:flex-row">
      <div className="flex w-full flex-1 flex-col justify-center px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <CategoryTags categoryIds={room.categoryIds} />
              <NoteTags notes={room.notes} />
            </div>
            <div className="my-1 flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">{room.name}</h4>
            </div>
            <CapacityRow capacity={room.capacity} />
            {availability && <RoomTimetable slots={availability.slots} />}
          </div>
          <ViewSpaceButton link={room.link} bookable={room.categoryIds?.includes('bookable')} />
        </div>
      </div>
    </div>
  );
};
