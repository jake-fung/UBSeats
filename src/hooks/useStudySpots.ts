import {useQuery} from '@tanstack/react-query';
import {
  fetchAmenities,
  fetchCategories,
  fetchReviewsBySpotId,
  fetchStudySpots,
} from '@/services/studySpotService';
import {Filter} from '@/utils/types';

// Hook to fetch all categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });
};

// Hook to fetch all amenities
export const useAmenities = () => {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: fetchAmenities
  });
};

// Hook to fetch all study spots
export const useStudySpots = (filters?: Filter) => {
  const { data: spots = [], isLoading, error } = useQuery({
    queryKey: ['studySpots'],
    queryFn: fetchStudySpots
  });

  // Apply filters if provided
  let filteredSpots = [...spots];
  
  if (filters) {
    if (filters.category) {
      filteredSpots = filteredSpots.filter(spot => 
        spot.categories.includes(filters.category!)
      );
    }
    
    if (filters.noise) {
      filteredSpots = filteredSpots.filter(spot => spot.noise <= filters.noise!);
    }
    
    if (filters.wifi) {
      filteredSpots = filteredSpots.filter(spot => spot.wifi >= filters.wifi!);
    }
    
    if (filters.seating) {
      filteredSpots = filteredSpots.filter(spot => spot.seating >= filters.seating!);
    }
    
    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      filteredSpots = filteredSpots.filter(spot => 
        spot.name.toLowerCase().includes(searchQuery) ||
        spot.description.toLowerCase().includes(searchQuery)
      );
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      filteredSpots = filteredSpots.filter(spot => 
        filters.amenities!.every(amenity => spot.amenities.includes(amenity))
      );
    }
  }

  return {
    spots: filteredSpots,
    isLoading,
    error
  };
};

// Hook to fetch reviews for a spot
export const useReviews = (spotId?: number) => {
  return useQuery({
    queryKey: ['reviews', spotId],
    queryFn: () => spotId ? fetchReviewsBySpotId(spotId) : Promise.resolve([]),
    enabled: !!spotId
  });
}
