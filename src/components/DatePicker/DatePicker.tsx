import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import { formatShortDay, isSameLocalDay, pickerDays, startOfLocalDay, toDateKey } from '@/utils/dateUtils';
import { cn } from '@/utils/cnUtils';
import { RoundButton } from '@/components/ui/round-button';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const FULL_LABEL = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const DatePicker = () => {
  const [open, setOpen] = useState(false);
  const { selectedDate, isToday, setSelectedDate } = useSelectedDate();
  const today = startOfLocalDay(new Date());
  const days = pickerDays(today);

  const choose = (date: Date | null) => {
    setSelectedDate(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RoundButton
          label={isToday ? 'Pick a day' : `Showing ${FULL_LABEL.format(selectedDate)}. Pick a day`}
          className={isToday ? undefined : 'bg-primary text-white'}
        >
          <CalendarDays aria-hidden="true" />
          {!isToday && <span className="pr-1 text-sm font-medium">{formatShortDay(selectedDate)}</span>}
        </RoundButton>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={12} className="w-auto bg-white p-3">
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="text-[10px] font-medium text-gray-500">
              {weekday}
            </div>
          ))}
          {days.map((day) => {
            const isPast = day < today;
            const isSelected = isSameLocalDay(day, selectedDate);
            const isTodayCell = isSameLocalDay(day, today);
            return (
              <button
                key={toDateKey(day)}
                type="button"
                disabled={isPast}
                aria-pressed={isSelected}
                aria-current={isTodayCell ? 'date' : undefined}
                aria-label={FULL_LABEL.format(day)}
                onClick={() => choose(day)}
                className={cn(
                  'h-8 w-8 rounded-full text-sm',
                  isPast && 'cursor-not-allowed text-gray-300',
                  !isPast && !isSelected && 'text-gray-700 hover:bg-gray-100',
                  isTodayCell && !isSelected && 'ring-1 ring-primary',
                  isSelected && 'bg-primary text-white',
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
        {!isToday && (
          <button
            type="button"
            className="mt-2 w-full text-center text-xs font-medium text-primary"
            onClick={() => choose(null)}
          >
            Back to today
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
