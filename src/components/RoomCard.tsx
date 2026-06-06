import { Room } from '@/supabase/schema/types';
import { useMemo } from 'react';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/HoursPill';
import { NoteTags } from '@/components/NoteTags';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CapacityRow } from '@/components/detail/CapacityRow';
import { ViewSpaceButton } from '@/components/detail/ViewSpaceButton';

interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const status = useMemo(() => getBuildingStatus(room.hours ?? []), [room.hours]);

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
      {room.image && <img className="h-80 w-full object-cover" src={room.image} alt={room.name} />}
      <div className="flex justify-between bg-white/70 px-5 py-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <CategoryIcon categoryIds={room.categoryIds} />
            <h4 className="text-base font-semibold text-gray-900">{room.name}</h4>
            <NoteTags notes={room.notes} />
          </div>
          <div className="flex items-center gap-2">
            {status && room.hours && <HoursPill status={status} hours={room.hours} />}
            <CapacityRow capacity={room.capacity} />
          </div>
        </div>
        <ViewSpaceButton link={room.link} />
      </div>
    </div>
  );
};
