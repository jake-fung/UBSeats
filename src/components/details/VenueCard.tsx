import { Venue } from '@/supabase/schema';
import { getBuildingStatus, hasAnyHours, hoursForDate } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/details/HoursPill';
import { RoomCard } from '@/components/details/RoomCard';
import { RoomDetails } from '@/components/details/RoomDetails';
import { BookOpen, ChevronDown } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/utils/cnUtils';

interface VenueCardProps {
  venue: Venue;
}

export const VenueCard = ({ venue }: VenueCardProps) => {
  const status = useMemo(() => getBuildingStatus(hoursForDate(venue, new Date()) ?? []), [venue]);
  const showHours = hasAnyHours(venue);
  const totalRooms = venue.totalRooms ?? venue.rooms.length;
  const narrowed = venue.rooms.length < totalRooms;
  const [userExpanded, setExpanded] = useState<boolean | null>(null);
  const expanded = userExpanded ?? narrowed;

  const flat = totalRooms === 1;
  const listId = useId();

  if (venue.rooms.length === 0) return null;

  const photo = venue.image && (
    <img src={venue.image} alt={venue.name} className="w-full object-cover" loading="lazy" />
  );

  if (flat) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white/70 shadow-lg">
        {showHours && (
          <div className="px-5 py-3">
            <HoursPill status={status} owner={venue} />
          </div>
        )}
        {photo}
        <RoomDetails room={venue.rooms[0]} venue={venue} />
      </div>
    );
  }

  const count = venue.rooms.length;

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 shadow-lg transition-all hover:shadow-xl motion-safe:hover:-translate-y-0.5">
      {photo}
      <div className="px-5 py-4">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
          className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg text-left"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <h4 className="text-base font-semibold text-gray-900">
              {venue.name} ({count} {count === 1 ? 'Space' : 'Spaces'})
            </h4>
          </span>
          <span className="flex items-center justify-center px-2 py-1 text-gray-700">
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', expanded ? 'rotate-180' : '')}
              aria-hidden="true"
            />
          </span>
        </button>
        {showHours && <HoursPill status={status} owner={venue} />}
        <div
          id={listId}
          inert={!expanded}
          className={cn(
            'grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out',
            expanded ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="flex flex-col gap-2 overflow-hidden">
            {venue.rooms.map((room) => (
              <RoomCard key={room.uuid} room={room} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
