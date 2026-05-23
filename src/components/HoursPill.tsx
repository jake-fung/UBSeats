import { DayHours } from '@/supabase/schema/types';
import { ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useState } from 'react';
import { BuildingStatus, formatTime } from '@/utils/hoursUtils';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDayHours(day: DayHours): string {
  if (!day.opensAt || !day.closesAt) return 'Closed';
  return `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`;
}

export interface HoursPillProps {
  status: BuildingStatus;
  hours: DayHours[];
}

export const HoursPill = ({ status, hours }: HoursPillProps) => {
  const [expanded, setExpanded] = useState(false);
  const today = new Date().getDay();

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className={cn(
          'z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          status.isOpen ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200',
        )}
      >
        <Clock className="h-3 w-3" />
        {status.isOpen
          ? status.closesAt
            ? `Open · Closes at ${status.closesAt}`
            : 'Open'
          : status.opensAt
            ? `Closed · Opens at ${status.opensAt}`
            : 'Closed today'}
        <div className={cn('flex items-center gap-1 transition-transform duration-200', expanded ? 'rotate-180' : '')}>
          <ChevronDown className="h-3 w-3" />
        </div>
      </button>
      {hours.length > 0 && (
        <div
          className={cn(
            'my-2 grid max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out',
            expanded && 'max-h-[200px] overflow-visible opacity-100',
          )}
        >
          <div className="rounded-2xl bg-white/80 px-6 py-4 text-xs text-gray-700 shadow-lg backdrop-blur-lg">
            {DAY_NAMES.map((name, i) => {
              const day = hours.find((h) => h.dayOfWeek === i);
              const isToday = i === today;
              return (
                <div
                  key={name}
                  className={cn('flex justify-between text-base', isToday && 'font-semibold text-gray-900')}
                >
                  <span>{name}</span>
                  <span>{day ? formatDayHours(day) : 'Closed'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
