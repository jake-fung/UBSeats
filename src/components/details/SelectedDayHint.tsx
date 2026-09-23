import { CalendarDays } from 'lucide-react';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import { formatShortDay } from '@/utils/dateUtils';

/**
 * Says which day the room timetables in this panel are showing when it isn't today. On mobile the
 * bottom sheet covers the date pill, so without this nothing in view names the day.
 */
export const SelectedDayHint = () => {
  const { selectedDate, isToday, setSelectedDate } = useSelectedDate();
  if (isToday) return null;

  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
      <CalendarDays size={14} className="shrink-0" aria-hidden="true" />
      <span>Showing {formatShortDay(selectedDate)}</span>
      <span aria-hidden="true">·</span>
      <button type="button" className="font-medium text-primary" onClick={() => setSelectedDate(null)}>
        Back to today
      </button>
    </div>
  );
};
