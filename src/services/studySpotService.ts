import {supabase} from '@/integrations/supabase/client';
import {Amenity, Category, Review, StudySpot} from '@/utils/types';
import {validateCategoryType} from '@/utils/spotUtils';

// Fetch all categories
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*');
  
  if (error) throw error;
  
  // Validate and transform the data to ensure CategoryType
  return data.map(item => ({
    id: validateCategoryType(item.id) || 'library', // Fallback to 'library' if invalid
    name: item.name,
    icon: item.icon,
    color: item.color
  }));
};

// Fetch all amenities
export const fetchAmenities = async (): Promise<Amenity[]> => {
  const { data, error } = await supabase.from('amenities').select('*');
  
  if (error) throw error;
  
  return data;
};

// Fetch all study spots with related data
export const fetchStudySpots = async (): Promise<StudySpot[]> => {
  // Fetch base study spots data
  const { data: spotsData, error: spotsError } = await supabase
    .from('study_spots')
    .select('*')
      .order('name', { ascending: true });
  
  if (spotsError) throw spotsError;
  
  // Create a map to store complete study spots
  const spots: StudySpot[] = [];
  
  // Process each spot
  for (const spot of spotsData) {
    // Fetch categories for this spot
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('spot_categories')
      .select('category_id')
      .eq('spot_id', spot.id);
    
    if (categoriesError) throw categoriesError;
    
    // Fetch amenities for this spot
    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('spot_amenities')
      .select('amenity_id')
      .eq('spot_id', spot.id);
    
    if (amenitiesError) throw amenitiesError;
    
    // Fetch images for this spot
    const { data: imagesData, error: imagesError } = await supabase
      .from('spot_images')
      .select('url')
      .eq('spot_id', spot.id);
    
    if (imagesError) throw imagesError;
    
    // Fetch peak hours for this spot
    const { data: peakHoursData, error: peakHoursError } = await supabase
      .from('peak_hours')
      .select('time_range')
      .eq('spot_id', spot.id);
    
    if (peakHoursError) throw peakHoursError;
    
    // Transform categories to array of category IDs
    const categories = categoriesData.map(cat => {
      const categoryType = validateCategoryType(cat.category_id);
      return categoryType || 'library'; // Default to 'library' if invalid
    });
    
    // Transform amenities to array of amenity IDs
    const amenities = amenitiesData.map(a => a.amenity_id);
    
    // Transform images to array of URLs
    const images = imagesData.map(img => img.url);
    
    // Transform peak hours to array of time ranges
    const peakHours = peakHoursData.map(ph => ph.time_range);
    
    // Create the complete spot object
    spots.push({
      id: spot.id,
      name: spot.name,
      description: spot.description,
      categories,
      location: {
        lat: spot.location_lat,
        lng: spot.location_lng,
        address: spot.location_address
      },
      images,
      rating: spot.rating,
      reviewCount: spot.review_count,
      noise: spot.noise,
      wifi: spot.wifi,
      seating: spot.seating,
      hours: {
        open: spot.hours_open,
        close: spot.hours_close,
        peakHours
      },
      amenities
    });
  }
  
  return spots;
};

// Fetch a single study spot by ID
export const fetchStudySpotById = async (id: string): Promise<StudySpot | null> => {
  const spots = await fetchStudySpots();
  return spots.find(spot => spot.id === id) || null;
};

// Fetch recent reviews
export const fetchRecentReviews = async (): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
      .order('date', { ascending: false });

  if (error) throw error;

  return data.map(review => ({
    id: review.id,
    spotId: review.spot_id,
    user: {
      name: review.user_name,
      avatar: review.user_avatar
    },
    date: review.date,
    rating: review.rating,
    content: review.content,
    helpful: review.helpful,
    categories: {
      comfort: review.comfort_rating,
      noise: review.noise_rating,
      amenities: review.amenities_rating
    }
  }));
};

// Fetch reviews for a specific study spot
export const fetchReviewsBySpotId = async (spotId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('spot_id', spotId);
  
  if (error) throw error;
  
  return data.map(review => ({
    id: review.id,
    spotId: review.spot_id,
    user: {
      name: review.user_name,
      avatar: review.user_avatar
    },
    date: review.date,
    rating: review.rating,
    content: review.content,
    helpful: review.helpful,
    categories: {
      comfort: review.comfort_rating,
      noise: review.noise_rating,
      amenities: review.amenities_rating
    }
  }));
};
