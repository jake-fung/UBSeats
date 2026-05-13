import { useQuery } from '@tanstack/react-query';
import { fetchAmenities, fetchBuildings, fetchCategories, fetchStudySpots } from '@/services/studySpotService';
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

export const useStudySpots = (filters?: Filter) => {
  const {
    data: spots = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['studySpots'],
    queryFn: fetchStudySpots,
  });

  // Apply filters if provided
  let filteredSpots = [...spots];

  if (filters) {
    if (filters.category) {
      filteredSpots = filteredSpots.filter((spot) => spot.categories.includes(filters.category!));
    }

    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      filteredSpots = filteredSpots.filter(
        (spot) => spot.name.toLowerCase().includes(searchQuery) || spot.description.toLowerCase().includes(searchQuery),
      );
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filteredSpots = filteredSpots.filter((spot) =>
        filters.amenities!.every((amenity) => spot.amenities.includes(amenity)),
      );
    }
  }

  return {
    spots: filteredSpots,
    isLoading,
    error,
  };
};

export const useBuildings = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: fetchBuildings,
  });
  return {
    buildings: data,
    isLoading,
    error,
  };
};
