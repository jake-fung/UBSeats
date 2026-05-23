import { Library, Room } from '@/supabase/schema/types';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/HoursPill';
import { BookOpen, ChevronDown, ExternalLink, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/utils/cnUtils';

const LibraryRoomCard = ({ room }: { room: Room }) => (
  <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
    <div className="mb-3 sm:mb-0">
      <h5 className="text-base font-semibold text-gray-900">{room.name}</h5>
      <div className="mt-1 flex items-center text-sm text-gray-500">
        <Users className="mr-1.5 h-4 w-4" />
        <span>Capacity: {room.capacity}</span>
      </div>
    </div>
    {room.link && (
      <button
        onClick={() => window.open(room.link, '_blank')}
        className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        View Space
        <ExternalLink className="ml-2 h-4 w-4" />
      </button>
    )}
  </div>
);

interface LibraryCardProps {
  library: Library;
}

export const LibraryCard = ({ library }: LibraryCardProps) => {
  const status = useMemo(() => getBuildingStatus(library?.hours), [library?.hours]);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="mt-4 cursor-pointer rounded-2xl border border-white/40 bg-white/70 px-5 py-4 shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
          <h4 className="text-base font-semibold text-gray-900">{library.name}</h4>
        </div>
        <div className="flex items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300">
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', expanded ? 'rotate-180' : '')} />
        </div>
      </div>
      {status ? (
        <HoursPill status={status} hours={library.hours} />
      ) : (
        <p className="text-xs text-gray-500">No hours available</p>
      )}
      {library.rooms && library.rooms.length > 0 && (
        <div
          className={cn(
            'flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out',
            expanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <h5 className="font-semibold text-gray-900">Library Spaces ({library.rooms.length})</h5>
          {library.rooms.map((room) => (
            <LibraryRoomCard key={room.uuid} room={room} />
          ))}
        </div>
      )}
    </div>
  );
};
