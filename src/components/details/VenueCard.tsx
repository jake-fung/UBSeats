import { Venue } from '@/supabase/schema/types';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/details/HoursPill';
import { RoomCard } from '@/components/details/RoomCard';
import { RoomDetails } from '@/components/details/RoomDetails';
import { VENUE_ICONS } from '@/components/details/venueIcons';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/utils/cnUtils';

interface VenueCardProps {
  venue: Venue;
}

/**
 * One card for any venue. A venue with several spaces (a library) collapses them
 * behind a chevron; a venue with a single space (every café today) renders flat and
 * hosts that room's controls directly, so its name is not shown twice.
 */
export const VenueCard = ({ venue }: VenueCardProps) => {
  const status = useMemo(() => getBuildingStatus(venue.hours), [venue.hours]);
  const [expanded, setExpanded] = useState(false);

  const flat = venue.rooms.length <= 1;
  const Icon = VENUE_ICONS[venue.kind];

  if (venue.rooms.length === 0) return null;

  const photo = venue.image && (
    <img src={venue.image} alt={venue.name} className="w-full object-cover" loading="lazy" />
  );

  if (flat) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white/70 shadow-lg">
        {photo}
        <div className="bg-white/70 px-5 pt-4">{status && <HoursPill status={status} hours={venue.hours} />}</div>
        <RoomDetails room={venue.rooms[0]} venue={venue} />
      </div>
    );
  }

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white/70 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
    >
      {photo}
      <div className="bg-white/70 px-5 py-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <h4 className="text-base font-semibold text-gray-900">
              {venue.name} ({venue.rooms.length} Spaces)
            </h4>
          </div>
          <div className="flex items-center justify-center px-2 py-1 text-sm font-medium text-gray-700">
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', expanded ? 'rotate-180' : '')} />
          </div>
        </div>
        {status && <HoursPill status={status} hours={venue.hours} />}
        <div
          className={cn(
            'flex flex-col gap-2 transition-all duration-300 ease-in-out',
            expanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          {venue.rooms.map((room) => (
            <RoomCard key={room.uuid} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
};
