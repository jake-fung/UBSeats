import { useQuery } from '@tanstack/react-query';
import { fetchClassroomDaySlots, fetchRoomAvailability } from '@/supabase/services/supabaseService';
import { Room, RoomAvailability } from '@/supabase/schema';
import { TimeSlot } from '@/utils/hoursUtils';
import { isSameLocalDay, toDateKey } from '@/utils/dateUtils';

const REFETCH_INTERVAL_MS = 90_000;
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
