import { useQuery } from '@tanstack/react-query';
import { fetchRoomAvailability } from '@/supabase/services/supabaseService';
import { RoomAvailability } from '@/supabase/schema/types';

export const useRoomAvailability = (roomUuid: string): RoomAvailability | null => {
  const { data } = useQuery({
    queryKey: ['room-availability'],
    queryFn: fetchRoomAvailability,
    refetchInterval: 90_000,
  });
  return data?.get(roomUuid) ?? null;
};
