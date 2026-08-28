import { Room } from '@/supabase/schema/types';
import { RoomDetails } from '@/components/details/RoomDetails';

interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => (
  <div className="flex flex-col rounded-2xl bg-white/70 shadow-lg sm:flex-row">
    <RoomDetails room={room} />
  </div>
);
