import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAmenities, fetchBuildings, fetchCategories } from '@/supabase/services/supabaseService';
import { Filter, Room } from '@/supabase/schema/types';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};

export const useAmenities = () => {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: fetchAmenities,
  });
};

export const useBuildings = (filters?: Filter) => {
  const {
    data: buildings = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['buildings'],
    queryFn: fetchBuildings,
  });

  const filteredBuildings = useMemo(() => {
    let result = [...buildings];

    if (filters) {
      if (filters.search) {
        const searchQuery = filters.search.toLowerCase();
        result = result.filter(
          (building) =>
            building.name.toLowerCase().includes(searchQuery) || building.code.toLowerCase().includes(searchQuery),
        );
      }

      if (filters.category) {
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
  }, [buildings, filters]);

  return {
    buildings: filteredBuildings,
    isLoading,
    error,
  };
};

