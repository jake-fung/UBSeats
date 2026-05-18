import { useQuery } from '@tanstack/react-query';
import { fetchAmenities, fetchBuildings, fetchCategories, fetchPOIs } from '@/services/studySpotService';
import { Filter } from '@/utils/types';

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
