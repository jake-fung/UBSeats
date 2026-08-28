import { Room, Venue } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CategoryTags } from '@/components/details/CategoryTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';
import { RoomTimetable } from '@/components/details/RoomTimetable';
import { FavouriteButton } from '@/components/details/FavouriteButton';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';

interface RoomDetailsProps {
  room: Room;
  venue?: Venue;
}

export const RoomDetails = ({ room, venue }: RoomDetailsProps) => {
  const availability = useRoomAvailability(room.uuid);
  const title = venue?.name ?? room.name;

  return (
    <div className="relative flex w-full flex-1 flex-col justify-center px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <FavouriteButton roomUuid={room.uuid} roomName={title} />
            <CategoryTags categoryIds={room.categoryIds} />
            <NoteTags notes={room.notes} />
          </div>
          <div className="flex items-center gap-1">
            <h4 className="text-base translate-y-[0.5px] font-semibold text-gray-900">{title}</h4>
          </div>
          <CapacityRow capacity={room.capacity} />
        </div>
        <ViewSpaceButton link={room.link} bookable={room.categoryIds?.includes('bookable')} />
      </div>
      {availability && <RoomTimetable slots={availability.slots} />}
    </div>
  );
};
