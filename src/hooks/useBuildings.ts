import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBuildings, fetchCategories } from '@/supabase/services/supabaseService';
import { Building, Category, Filter, Room } from '@/supabase/schema/types';
import { filterBuildingsBySearch } from '@/hooks/useSearch';
import { isBuildingOpenNow } from '@/utils/hoursUtils';
import { useFavourites } from '@/hooks/useFavourites';
import { useRoomAvailabilityMap } from '@/hooks/useRoomAvailability';

const AVAILABLE_ROOMS_CATEGORIES: Category = { id: 'now_available_rooms', name: 'Now Available Rooms', icon: 'CheckCircle', color: '#16A34A' };
const OPEN_BUILDINGS_CATEGORIES: Category = { id: 'open_buildings', name: 'Open Buildings', icon: 'Building2', color: '#3B82F6' };


export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => [AVAILABLE_ROOMS_CATEGORIES, OPEN_BUILDINGS_CATEGORIES, ...(await fetchCategories())],
  });
};

const filterBuildingsByRoom = (buildings: Building[], keepRoom: (room: Room) => boolean): Building[] =>
  buildings
    .map((building) => ({
      ...building,
      rooms: building.rooms.filter(keepRoom),
      library: building.library ? { ...building.library, rooms: building.library.rooms.filter(keepRoom) } : null,
    }))
    .filter((building) => building.rooms.length > 0 || (building.library?.rooms.length ?? 0) > 0);

export const useBuildings = (filters?: Filter, searchQuery?: string) => {
  const { favourites } = useFavourites();
  const availability = useRoomAvailabilityMap();

  const {
    data: buildings = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ['buildings'],
    queryFn: fetchBuildings,
  });

  const filteredBuildings = useMemo(() => {
    const result = filterBuildingsBySearch([...buildings], searchQuery);

    switch (filters?.category) {
      case undefined:
        return result;
      case 'open_buildings':
        return result.filter((building) => isBuildingOpenNow(building.hours, building.library?.hours));
      case 'now_available_rooms':
        return filterBuildingsByRoom(result, (room) => availability?.get(room.uuid)?.isAvailableNow === true);
      case 'favourites':
        return filterBuildingsByRoom(result, (room) => favourites.has(room.uuid));
      default: {
        const categoryQuery = filters.category.toLowerCase();
        return filterBuildingsByRoom(result, (room) => room.categoryIds?.includes(categoryQuery) === true);
      }
    }
  }, [buildings, filters, searchQuery, favourites, availability]);

  return {
    buildings: filteredBuildings,
    isLoading,
    error,
  };
};
