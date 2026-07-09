import { useState } from 'react';
import { DayHours, Room } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CategoryTags } from '@/components/details/CategoryTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';
import { AvailabilityBadge } from '@/components/details/AvailabilityBadge';
import { RoomTimetable } from '@/components/details/RoomTimetable';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';
import { cn } from '@/utils/cnUtils';

interface RoomCardProps {
  room: Room;
  hours: DayHours[];
}

export const RoomCard = ({ room, hours }: RoomCardProps) => {
  const availability = useRoomAvailability(room.uuid);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white/70 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:flex-row"
    >
      {room.image && (
        <img
          className="aspect-video w-full shrink-0 object-cover sm:aspect-square sm:w-28"
          src={room.image}
          alt={room.name}
          loading="lazy"
        />
      )}
      <div className="flex flex-1 flex-col justify-center px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <CategoryTags categoryIds={room.categoryIds} />
              <NoteTags notes={room.notes} />
            </div>
            <div className="my-1 flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">{room.name}</h4>
              <AvailabilityBadge availability={availability} />
            </div>
            <CapacityRow capacity={room.capacity} />
          </div>
          <ViewSpaceButton link={room.link} />
        </div>
        <div
          className={cn(
            'flex flex-col transition-all duration-300 ease-in-out',
            expanded ? 'mt-3 max-h-[9999px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <RoomTimetable hours={hours} />
        </div>
      </div>
    </div>
  );
};
