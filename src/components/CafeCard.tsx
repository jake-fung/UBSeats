import { Room } from '@/supabase/schema/types';
import { Coffee, Users, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/HoursPill';
import { NoteTags } from '@/components/NoteTags';

interface CafeCardProps {
  cafe: Room;
}

export const CafeCard = ({ cafe }: CafeCardProps) => {
  const status = useMemo(() => getBuildingStatus(cafe.hours ?? []), [cafe.hours]);

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
      {cafe.image && <img className="h-40 w-full object-cover" src={cafe.image} alt={cafe.name} />}
      <div className="bg-white/70 px-5 py-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Coffee className="h-4 w-4 flex-shrink-0 text-[#E67E22]" />
          <h4 className="text-base font-semibold text-gray-900">{cafe.name}</h4>
          <NoteTags notes={cafe.notes} />
        </div>
        {status && cafe.hours && <HoursPill status={status} hours={cafe.hours} />}
        {cafe.capacity != null && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Users className="mr-1.5 h-4 w-4" />
            <span>Capacity: {cafe.capacity}</span>
          </div>
        )}
        {cafe.link && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(cafe.link, '_blank');
            }}
            className="mt-3 flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-md active:bg-blue-800"
          >
            View Space
            <ExternalLink className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
