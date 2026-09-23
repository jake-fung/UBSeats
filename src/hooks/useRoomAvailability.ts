import { useQuery } from '@tanstack/react-query';
import { fetchClassroomDaySlots, fetchRoomAvailability } from '@/supabase/services/supabaseService';
import { Room, RoomAvailability } from '@/supabase/schema/types';
import { TimeSlot } from '@/utils/hoursUtils';
import { isSameLocalDay, toDateKey } from '@/utils/dateUtils';

const REFETCH_INTERVAL_MS = 90_000;
// Classroom bookings only change when the scraper is run by hand.
const CLASSROOM_DAY_STALE_MS = 5 * 60_000;

export const useRoomAvailabilityMap = () => {
  const { data } = useQuery({
    queryKey: ['room-availability'],
    queryFn: fetchRoomAvailability,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
  return data;
};

export const useRoomAvailability = (roomUuid: string): RoomAvailability | null => {
  return useRoomAvailabilityMap()?.get(roomUuid) ?? null;
};

/**
 * The slots a room's timetable should draw for `date`.
 *
 * - Today: the live availability map, exactly as before, for every room.
 * - A future day, classroom: that day's bookings, fetched once per day for all
 *   classrooms (keyed by date, not room) and null when no scrape covers the day.
 * - A future day, anything else: the LibCal row, which already holds this week and
 *   next. computeDayBlocks picks out the day by overlap, so no slicing is needed.
 *   If no slot ends after the day's local start, the row does not reach that day (a
 *   today-only sync, a new week before the next sync, or a browser east of Pacific
 *   already on its next day), so this returns null (no timetable) rather than a row
 *   that would read as "Closed all day". A real closure mid-window still reads as
 *   closed, because slots on later days exist.
 *
 * LibCal rooms and classrooms are disjoint, so the room's category decides the source.
 * A classroom never falls back to today's slots drawn on the wrong date.
 */
export const useRoomDaySlots = (room: Room, date: Date): TimeSlot[] | null => {
  const availability = useRoomAvailability(room.uuid);
  const isClassroom = room.categoryIds?.includes('classroom') ?? false;
  const isToday = isSameLocalDay(date, new Date());

  const { data: classroomDay } = useQuery({
    queryKey: ['classroom-day-slots', toDateKey(date)],
    queryFn: () => fetchClassroomDaySlots(date),
    enabled: isClassroom && !isToday,
    staleTime: CLASSROOM_DAY_STALE_MS,
  });

  if (isToday) return availability?.slots ?? null;
  if (!isClassroom) {
    const slots = availability?.slots;
    if (!slots?.some((s) => new Date(s.end).getTime() > date.getTime())) return null;
    return slots;
  }
  return classroomDay?.get(room.uuid) ?? null;
};
