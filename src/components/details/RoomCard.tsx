import { Room } from '@/supabase/schema/types';
import { useMemo } from 'react';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/details/HoursPill';
import { NoteTags } from '@/components/details/NoteTags';
import { CategoryTags } from '@/components/details/CategoryTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';

interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const status = useMemo(() => getBuildingStatus(room.hours ?? []), [room.hours]);

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
        <div>
          <div className="flex items-center gap-1">
            <CategoryTags categoryIds={room.categoryIds} />
            <NoteTags notes={room.notes} />
          </div>
          <div className="my-1 flex flex-wrap items-center">
            <h4 className="text-base font-semibold text-gray-900">{room.name}</h4>
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
