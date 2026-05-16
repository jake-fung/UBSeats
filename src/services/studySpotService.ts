import { supabase } from '@/supabase/client';
import { Amenity, Building, Category, StudySpot } from '@/utils/types';
import { validateCategoryType } from '@/utils/spotUtils';

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

    const { data: openingHoursData, error: openingHoursError } = await supabase
      .from('spot_opening_hours')
      .select('*')
      .eq('spot_id', spot.id);
    if (openingHoursError) throw openingHoursError;

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
    const openingHours =
      openingHoursData.length > 0
        ? {
            open24: openingHoursData[0].open24,
            periods: {
              monOpen: openingHoursData[0].monOpen,
              tueOpen: openingHoursData[0].tueOpen,
              wedOpen: openingHoursData[0].wedOpen,
              thuOpen: openingHoursData[0].thuOpen,
              friOpen: openingHoursData[0].friOpen,
              satOpen: openingHoursData[0].satOpen,
              sunOpen: openingHoursData[0].sunOpen,
              monClose: openingHoursData[0].monClose,
              tueClose: openingHoursData[0].tueClose,
              wedClose: openingHoursData[0].wedClose,
              thuClose: openingHoursData[0].thuClose,
              friClose: openingHoursData[0].friClose,
              satClose: openingHoursData[0].satClose,
              sunClose: openingHoursData[0].sunClose,
            },
          }
        : null;

    // let placeDetails = null;

    // if (spot.google_maps_id) {
    //   const placeDetailsData = await getPlaceDetails(spot.google_maps_id);

    //   if (placeDetailsData) {
    //     placeDetails = placeDetailsData;
    //   }
    // }

    spots.push({
      id: spot.id,
      name: spot.name,
      googleMapsPlaceId: spot.google_maps_id,
      description: spot.description,
      categories,
      location: {
        lat: spot.location_lat,
        lng: spot.location_lng,
        address: spot.location_address,
      },
      images,
      hours: {
        periods: openingHours.periods,
        open24: openingHours.open24,
        peakHours,
      },
      amenities,
    });
  }

  return spots;
};

export const fetchBuildings = async (): Promise<Building[]> => {
  const { data: buildingData, error: buildingError } = await supabase.from('buildings').select('*');
  if (buildingError) throw buildingError;

  const { data: roomsData, error: roomsError } = await supabase.from('building_rooms').select('*');
  if (roomsError) throw roomsError;

  return buildingData
    .map((b) => ({
      uuid: b.uuid,
      name: b.NAME,
      primaryAddress: b.PRIMARY_ADDRESS,
      code: b.BLDG_CODE,
      lat: b.LAT,
      lng: b.LONG,
      rooms: roomsData
        .filter((r) => r.building_uuid === b.uuid)
        .map((r) => ({
          uuid: r.uuid,
          building_uuid: r.building_uuid,
          name: r.room_name,
          capacity: r.capacity,
        })),
    }))
    .filter((b) => b.rooms.length > 0);
};
