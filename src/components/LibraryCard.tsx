import { Library } from '@/supabase/schema/types';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/HoursPill';
import { BookOpen, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/utils/cnUtils';
import { RoomCard } from './RoomCard';

interface LibraryCardProps {
  library: Library;
}

export const LibraryCard = ({ library }: LibraryCardProps) => {
  const status = useMemo(() => getBuildingStatus(library?.hours), [library?.hours]);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="mt-4 cursor-pointer overflow-hidden rounded-2xl bg-white/70 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div>{library.image && <img className="object-cover" src={library.image} alt={library.name} />}</div>
      <div className="bg-white/70 px-5 py-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
            <h4 className="text-base font-semibold text-gray-900">
              {library.name} ({library.rooms.length} Spaces)
            </h4>
          </div>
          <div className="flex items-center justify-center px-2 py-1 text-sm font-medium text-gray-700">
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', expanded ? 'rotate-180' : '')} />
          </div>
        </div>
        {status && <HoursPill status={status} hours={library.hours} />}
        <div
          className={cn(
            'flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out',
            expanded ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          {library.rooms.map((room) => (
            <RoomCard key={room.uuid} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
};
