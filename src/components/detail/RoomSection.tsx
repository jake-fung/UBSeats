import { Room } from '@/supabase/schema/types';
import { RoomCard } from '@/components/RoomCard';

interface RoomSectionProps {
  rooms: Room[];
  heading: string;
}

/** A titled list of RoomCards; renders nothing when there are no rooms. */
export const RoomSection = ({ rooms, heading }: RoomSectionProps) => {
  if (rooms.length === 0) return null;
  return (
    <>
      <div className="flex items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {heading} ({rooms.length})
        </h3>
      </div>
      {rooms.map((room) => (
        <RoomCard key={room.uuid} room={room} />
      ))}
    </>
  );
};
