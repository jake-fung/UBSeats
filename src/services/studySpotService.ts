import { supabase } from '@/integrations/supabase/client';
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
      .from('spot_peak_hours')
      .select('time_range')
      .eq('spot_id', spot.id);
    
    if (peakHoursError) throw peakHoursError;

    // Fetch opening hours for this spot
    const { data: hoursData, error: hoursError } = await supabase
        .from('spot_opening_hours')
        .select('*')
        .eq('spot_id', spot.id);

    if (hoursError) throw hoursError;
    
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

    // Transform opening hours to a readable format
    const openingHours = hoursData.length > 0 ? {
      monday_open: hoursData[0].monday_open,
      monday_close: hoursData[0].monday_close,
      tuesday_open: hoursData[0].tuesday_open,
      tuesday_close: hoursData[0].tuesday_close,
      wednesday_open: hoursData[0].wednesday_open,
      wednesday_close: hoursData[0].wednesday_close,
      thursday_open: hoursData[0].thursday_open,
      thursday_close: hoursData[0].thursday_close,
      friday_open: hoursData[0].friday_open,
      friday_close: hoursData[0].friday_close,
      saturday_open: hoursData[0].saturday_open,
      saturday_close: hoursData[0].saturday_close,
      sunday_open: hoursData[0].sunday_open,
      sunday_close: hoursData[0].sunday_close
    } : null;
    
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
      noise: spot.noise,
      wifi: spot.wifi,
      seating: spot.seating,
      hours: {
        opening_hours: openingHours || {
          monday_open: "0",
          monday_close: "0",
          tuesday_open: "0",
          tuesday_close: "0",
          wednesday_open: "0",
          wednesday_close: "0",
          thursday_open: "0",
          thursday_close: "0",
          friday_open: "0",
          friday_close: "0",
          saturday_open: "0",
          saturday_close: "0",
          sunday_open: "0",
          sunday_close: "0",
        },
        peakHours
      },
      amenities
    });
  }
  
  return spots;
};

// Fetch a single study spot by ID
// export const fetchStudySpotById = async (id: string): Promise<StudySpot | null> => {
//   const spots = await fetchStudySpots();
//   return spots.find(spot => spot.id === id) || null;
// };

// Fetch reviews for a specific study spot
export const fetchReviewsBySpotId = async (spotId: number): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('spot_id', spotId)
      .order('date', { ascending: false })
      .order('time', { ascending: false });
  
  if (error) throw error;
  
  return data.map(review => ({
    id: review.reviews_id,
    spotId: review.spot_id,
    user: {
      name: review.user_name,
      avatar: review.user_avatar
    },
    date: review.date,
    time: review.time,
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

// Update the helpful count for a review
export const updateReviewHelpfulCount = async (reviewId: string, newHelpfulCount: number): Promise<number> => {
  const { data, error: helpfulError } = await supabase
    .from('reviews')
    .update({ helpful: newHelpfulCount })
    .eq('reviews_id', reviewId)
    .select('helpful');

  if (helpfulError) throw helpfulError;

  return data[0].helpful;
};

// Submit a new review
export const submitReviewByReviewId = async (review: any): Promise<void> => {
  const { error: submitError } = await supabase
    .from('reviews')
    .insert({
      spot_id: review.spotId,
      user_name: "Jake Fung",
      user_avatar: "https://randomuser.me/api/portraits/lego/1.jpg",
      date: review.date,
      time: review.time,
      rating: review.ratings.overall,
      content: review.comment,
      helpful: 0,
      comfort_rating: review.ratings.comfort,
      noise_rating: review.ratings.noise,
      amenities_rating: review.ratings.amenities
    });

  if (submitError) throw submitError;
};