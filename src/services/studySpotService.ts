import { supabase } from '@/supabase/client';
import { Amenity, Category, Review, StudySpot } from '@/utils/types';
import { validateCategoryType } from '@/utils/spotUtils';
import { getPlaceDetails } from '@/services/googleMapsService';

// Fetch all categories
export const fetchCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*');

    if (error) throw error;

    // Validate and transform the data to ensure CategoryType
    return data.map((item) => ({
        id: validateCategoryType(item.id) || 'library', // Fallback to 'library' if invalid
        name: item.name,
        icon: item.icon,
        color: item.color,
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
    const { data: spotsData, error: spotsError } = await supabase
        .from('study_spots')
        .select('*')
        .order('name', { ascending: true });
    if (spotsError) throw spotsError;

    const spots: StudySpot[] = [];

    for (const spot of spotsData) {
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('spot_categories')
            .select('category_id')
            .eq('spot_id', spot.id);
        if (categoriesError) throw categoriesError;

        const { data: amenitiesData, error: amenitiesError } = await supabase
            .from('spot_amenities')
            .select('amenity_id')
            .eq('spot_id', spot.id);
        if (amenitiesError) throw amenitiesError;

        const { data: imagesData, error: imagesError } = await supabase
            .from('spot_images')
            .select('url')
            .eq('spot_id', spot.id);
        if (imagesError) throw imagesError;

        const { data: peakHoursData, error: peakHoursError } = await supabase
            .from('spot_peak_hours')
            .select('time_range')
            .eq('spot_id', spot.id);
        if (peakHoursError) throw peakHoursError;

        const categories = categoriesData.map((cat) => {
            const categoryType = validateCategoryType(cat.category_id);
            return categoryType || 'library';
        });
        const amenities = amenitiesData.map((a) => a.amenity_id);
        const images = imagesData.map((img) => img.url);
        const peakHours = peakHoursData.map((ph) => ph.time_range);

        let placeDetails = null;

        if (spot.google_maps_id) {
            const placeDetailsData = await getPlaceDetails(spot.google_maps_id);

            if (placeDetailsData) {
                placeDetails = placeDetailsData;
            }
        }

        spots.push({
            id: spot.id,
            name: spot.name,
            googleMapsPlaceId: spot.google_maps_id,
            description: spot.description,
            categories,
            location: {
                lat: placeDetails?.location?.latitude || 0,
                lng: placeDetails?.location?.longitude || 0,
                address: placeDetails?.formattedAddress,
            },
            images,
            noise: spot.noise,
            wifi: spot.wifi,
            seating: spot.seating,
            hours: {
                openNow: placeDetails?.currentOpeningHours?.openNow || false,
                periods: placeDetails?.currentOpeningHours?.periods || [],
                weekdayDescriptions: placeDetails?.currentOpeningHours?.weekdayDescriptions || [],
                peakHours,
            },
            amenities,
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

    return data.map((review) => ({
        id: review.reviews_id,
        spotId: review.spot_id,
        user: {
            name: review.user_name,
            avatar: review.user_avatar,
        },
        date: review.date,
        time: review.time,
        rating: review.rating,
        content: review.content,
        helpful: review.helpful,
        categories: {
            comfort: review.comfort_rating,
            noise: review.noise_rating,
            amenities: review.amenities_rating,
        },
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

type SubmitReview = {
    spotId: number;
    date: string;
    time: string;
    ratings: {
        overall: number;
        comfort: number;
        noise: number;
        amenities: number;
    };
    comment: string;
};

// Submit a new review
export const submitReviewByReviewId = async (review: SubmitReview): Promise<void> => {
    const { error: submitError } = await supabase.from('reviews').insert({
        spot_id: review.spotId,
        user_name: 'Jake Fung',
        user_avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
        date: review.date,
        time: review.time,
        rating: review.ratings.overall,
        content: review.comment,
        helpful: 0,
        comfort_rating: review.ratings.comfort,
        noise_rating: review.ratings.noise,
        amenities_rating: review.ratings.amenities,
    });

    if (submitError) throw submitError;
};
