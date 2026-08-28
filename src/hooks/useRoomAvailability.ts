import { useQuery } from '@tanstack/react-query';
import { fetchRoomAvailability } from '@/supabase/services/supabaseService';
import { RoomAvailability } from '@/supabase/schema/types';

const REFETCH_INTERVAL_MS = 90_000;

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
