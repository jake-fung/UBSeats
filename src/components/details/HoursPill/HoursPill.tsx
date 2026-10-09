import { DayHours } from '@/supabase/schema';
import { ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useId, useState } from 'react';
import { BuildingStatus, formatTime, hoursForDate, HoursOwner } from '@/utils/hoursUtils';
import { useSelectedDate } from '@/hooks/useSelectedDate';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDayHours(day: DayHours): string {
  if (!day || !day.opensAt || !day.closesAt) return 'Closed';
  return `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`;
}

export interface HoursPillProps {
  /** Today's open/closed status; null when today's hours are unknown. */
  status: BuildingStatus | null;
  owner: HoursOwner;
}

export const HoursPill = ({ status, owner }: HoursPillProps) => {
  const [expanded, setExpanded] = useState(false);
  const { selectedDate, isToday } = useSelectedDate();
  const highlightedDay = selectedDate.getDay();
  // The selected day's week: a synced library may differ week to week, or not be published yet.
  const hours = hoursForDate(owner, selectedDate);
  const listId = useId();
  const dayText = hours ? formatDayHours(hours.find((h) => h.dayOfWeek === highlightedDay)) : 'Hours not published yet';
  // Colour alone never carries open/closed: say it in words whenever the colour does.
  const statusPrefix = isToday && status ? (status.isOpen ? 'Open · ' : 'Closed · ') : '';
  const pillLabel = statusPrefix === 'Closed · ' && dayText === 'Closed' ? 'Closed' : statusPrefix + dayText;
  const hasList = !!hours && hours.length > 0;

  return (
    <div>
      <button
        type="button"
        aria-expanded={hasList ? expanded : undefined}
        aria-controls={hasList ? listId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className={cn(
          'z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          isToday && status
            ? status.isOpen
              ? 'bg-status-open text-status-open-fg hover:bg-green-200'
              : 'bg-status-closed text-status-closed-fg hover:bg-red-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        )}
      >
        <Clock className="h-3 w-3" aria-hidden="true" />
        {pillLabel}
        <div className={cn('flex items-center gap-1 transition-transform duration-200', expanded ? 'rotate-180' : '')}>
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </div>
      </button>
      {hasList && (
        <div
          id={listId}
          aria-hidden={!expanded}
          className={cn(
            'grid max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out',
            expanded && 'my-1 max-h-50 overflow-visible opacity-100',
          )}
        >
          <div className="rounded-2xl bg-white/80 px-6 py-4 text-xs text-gray-700 shadow-md backdrop-blur-sm">
            {DAY_NAMES.map((name, i) => {
              const day = hours.find((h) => h.dayOfWeek === i);
              const isHighlighted = i === highlightedDay;
              return (
                <div
                  key={name}
                  className={cn('flex justify-between text-base', isHighlighted && 'font-semibold text-gray-900')}
                >
                  <span>{name}</span>
                  <span>{formatDayHours(day)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
