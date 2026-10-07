import { CalendarDays } from 'lucide-react';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import { formatShortDay } from '@/utils/dateUtils';

/**
 * Says which day the room timetables in this panel are showing when it isn't today. On mobile the
 * bottom sheet covers the date pill, so without this nothing in view names the day.
 */
export const SelectedDayHint = () => {
  const { selectedDate, isToday } = useSelectedDate();
  if (isToday) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
      <CalendarDays size={16} className="shrink-0" aria-hidden="true" />
      <span>Showing {formatShortDay(selectedDate)} opening hours & timetable</span>
    </div>
  );
};
