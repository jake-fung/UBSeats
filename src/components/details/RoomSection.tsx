import { Room, Venue } from '@/supabase/schema/types';
import { RoomCard } from '@/components/details/RoomCard';
import { VenueCard } from '@/components/details/VenueCard';

interface RoomSectionProps {
  rooms: Room[];
  venues: Venue[];
  heading: string;
}

type Item =
  { kind: 'venue'; key: string; name: string; venue: Venue } | { kind: 'room'; key: string; name: string; room: Room };

/**
 * A titled list of venues and loose rooms, interleaved alphabetically so a venue
 * sits where its name puts it rather than pinned above the list. Renders nothing
 * when the building has no spaces at all.
 */
export const RoomSection = ({ rooms, venues, heading }: RoomSectionProps) => {
  // The heading counts bookable spaces, not list items: a collapsed library of
  // eight rooms is one item but eight spaces.
  const total = rooms.length + venues.reduce((n, v) => n + v.rooms.length, 0);
  if (total === 0) return null;

  const items: Item[] = [
    ...venues.map((venue): Item => ({ kind: 'venue', key: venue.id, name: venue.name, venue })),
    ...rooms.map((room): Item => ({ kind: 'room', key: room.uuid, name: room.name, room })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="flex items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {heading} ({total})
        </h3>
      </div>
      {items.map((item) =>
        item.kind === 'venue' ? (
          <VenueCard key={item.key} venue={item.venue} />
        ) : (
          <RoomCard key={item.key} room={item.room} />
        ),
      )}
    </>
  );
};
