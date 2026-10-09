import { createContext, useCallback, useContext, useMemo } from 'react';
import { fromDateKey, isSameLocalDay, toDateKey } from '@/utils/dateUtils';

export interface SelectedDateState {
  /** null means "today", whatever today currently is; otherwise a local "YYYY-MM-DD". */
  selectedKey: string | null;
  setSelectedKey: (key: string | null) => void;
}

export const SelectedDateContext = createContext<SelectedDateState | null>(null);

/**
 * The day every RoomTimetable shows. Resolution happens here, in the consumer, rather
 * than in the provider: consumers re-render on each 90 s availability poll, so a day
 * picked yesterday falls back to today without any midnight timer.
 */
export const useSelectedDate = () => {
  const ctx = useContext(SelectedDateContext);
  if (!ctx) throw new Error('useSelectedDate must be used within SelectedDateProvider');
  const { selectedKey, setSelectedKey } = ctx;

  const todayKey = toDateKey(new Date());
  // Keys are zero-padded, so string order is date order. A picked day that has since
  // passed (app left open overnight) resolves to today.
  const effectiveKey = selectedKey && selectedKey > todayKey ? selectedKey : todayKey;
  const selectedDate = useMemo(() => fromDateKey(effectiveKey), [effectiveKey]);

  const setSelectedDate = useCallback(
    (date: Date | null) => setSelectedKey(date && !isSameLocalDay(date, new Date()) ? toDateKey(date) : null),
    [setSelectedKey],
  );

  return { selectedDate, isToday: effectiveKey === todayKey, setSelectedDate };
};
