import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBuildings, fetchCategories } from '@/supabase/services/supabaseService';
import { Category, Filter, Room } from '@/supabase/schema/types';
import { filterBuildingsBySearch } from '@/hooks/useSearch';
import { isBuildingOpenNow } from '@/utils/hoursUtils';

const OPEN_NOW_CATEGORY: Category = { id: 'open_now', name: 'Open now', icon: 'Clock', color: '#16A34A' };

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => [OPEN_NOW_CATEGORY, ...(await fetchCategories())],
  });
};

export const useBuildings = (filters?: Filter, searchQuery?: string) => {
  const {
    data: buildings = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['buildings'],
    queryFn: fetchBuildings,
  });

  const filteredBuildings = useMemo(() => {
    let result = filterBuildingsBySearch([...buildings], searchQuery);

    if (filters) {
      if (filters.category === 'open_now') {
        result = result.filter((building) => isBuildingOpenNow(building.hours, building.library?.hours));
      } else if (filters.category) {
        const categoryQuery = filters.category.toLowerCase();

        const filteredRooms: Record<string, Room[]> = {}
        const filteredLibraryRooms: Record<string, Room[]> = {};
        result = result
          .filter((building) => {
            const filteredRoomsForBuilding = building.rooms.filter((room) =>
              room.categoryIds?.includes(categoryQuery),
            );
            const filteredLibraryRoomsForBuilding = building.library?.rooms.filter((libraryRoom) =>
              libraryRoom.categoryIds?.includes(categoryQuery),
            );
            filteredRooms[building.uuid] = filteredRoomsForBuilding;
            filteredLibraryRooms[building.uuid] = filteredLibraryRoomsForBuilding;
            return (
              filteredRooms[building.uuid].length > 0 ||
              filteredLibraryRooms[building.uuid]?.length > 0
            );
          })
          .map((building) => ({
            ...building,
            library: building.library ? {
              ...building.library,
              rooms: filteredLibraryRooms[building.uuid],
            } : null,
            rooms: filteredRooms[building.uuid],
          }));
      }
    }

    return result;
  }, [buildings, filters, searchQuery]);

  return {
    buildings: filteredBuildings,
    isLoading,
    error,
  };
};
