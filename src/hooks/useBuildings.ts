import { useQuery } from '@tanstack/react-query';
import { fetchAmenities, fetchBuildings, fetchCategories, fetchPOIs } from '@/supabase/services/supabaseService';
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

  let filteredBuildings = [...buildings];

  if (filters) {
    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      filteredBuildings = filteredBuildings.filter(
        (building) =>
          building.name.toLowerCase().includes(searchQuery) || building.code.toLowerCase().includes(searchQuery),
      );
    }

    if (filters.category) {
      const categoryQuery = filters.category.toLowerCase();

      const filteredRooms: Record<string, Room[]> = {};
      filteredBuildings = filteredBuildings.filter((building) => {
        filteredRooms[building.uuid] = building.rooms.filter((room) => room.categoryIds?.includes(categoryQuery));
        return filteredRooms[building.uuid].length > 0;
      }).map((building) => {
        return {
          ...building,
          rooms: filteredRooms[building.uuid],
        };
      });
    }
  }

  return {
    buildings: filteredBuildings,
    isLoading,
    error,
  };
};

export const usePOIs = () => {
  const {
    data: pois = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['pois'],
    queryFn: fetchPOIs,
  });

  return {
    pois,
    isLoading,
    error,
  };
};
