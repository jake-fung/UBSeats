import { Room, Venue } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CategoryTags } from '@/components/details/CategoryTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';
import { RoomTimetable } from '@/components/details/RoomTimetable';
import { FavouriteButton } from '@/components/details/FavouriteButton';
import { VENUE_ICONS } from '@/components/details/venueIcons';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';

interface RoomDetailsProps {
  room: Room;
  /**
   * Present when this room is the sole space of a flat VenueCard. The row is then
   * titled by its venue rather than by itself, so the two names do not appear twice
   * in the same card.
   */
  venue?: Venue;
}

/**
 * A room's tags, name, capacity, booking link and timetable — with no card chrome,
 * so both RoomCard and a flat VenueCard can host it.
 */
export const RoomDetails = ({ room, venue }: RoomDetailsProps) => {
  const availability = useRoomAvailability(room.uuid);
  const title = venue?.name ?? room.name;
  const Icon = venue ? VENUE_ICONS[venue.kind] : null;

  return (
    <div className="relative flex w-full flex-1 flex-col justify-center px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <CategoryTags categoryIds={room.categoryIds} />
            <NoteTags notes={room.notes} />
          </div>
          <div className="my-1 flex items-center gap-0.5">
            {Icon && <Icon className="mr-1 h-4 w-4 shrink-0 text-primary" />}
            <h4 className="text-base font-semibold text-gray-900">{title}</h4>
            <FavouriteButton roomUuid={room.uuid} roomName={title} />
          </div>
          <CapacityRow capacity={room.capacity} />
        </div>
        <ViewSpaceButton link={room.link} bookable={room.categoryIds?.includes('bookable')} />
      </div>
      {availability && <RoomTimetable slots={availability.slots} />}
    </div>
  );
};
