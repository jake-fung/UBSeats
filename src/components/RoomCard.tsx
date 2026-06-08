import { Room } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';

export interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="mb-3 sm:mb-0">
        <div className="flex flex-wrap items-center gap-x-3">
          <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
          <NoteTags notes={room.notes} />
        </div>
        <CapacityRow capacity={room.capacity} />
      </div>
      <ViewSpaceButton link={room.link} />
    </div>
  );
};
