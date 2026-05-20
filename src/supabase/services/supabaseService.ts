import { supabase } from '@/supabase/client';
import { Amenity, Building, Category, POI } from '@/supabase/schema/types';
import { validateCategoryType } from '@/utils/spotUtils';

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*');

  if (error) throw error;

  return data.map((item) => ({
    id: validateCategoryType(item.id) || 'library',
    name: item.name,
    icon: item.icon,
    color: item.color,
  }));
};

export const fetchAmenities = async (): Promise<Amenity[]> => {
  const { data, error } = await supabase.from('amenities').select('*');

  if (error) throw error;

  return data;
};

export const fetchBuildings = async (): Promise<Building[]> => {
  const { data: buildingData, error: buildingError } = await supabase.from('buildings').select('*');
  if (buildingError) throw buildingError;

  const { data: imagesData, error: imagesError } = await supabase.from('building_images').select('*');
  if (imagesError) throw imagesError;

  const { data: roomsData, error: roomsError } = await supabase.from('building_rooms').select('*');
  if (roomsError) throw roomsError;

  const { data: categoriesData, error: categoriesError } = await supabase.from('room_categories').select('*');
  if (categoriesError) throw categoriesError;

  return buildingData
    .map((b) => ({
      uuid: b.uuid,
      name: b.NAME,
      primaryAddress: b.PRIMARY_ADDRESS,
      code: b.BLDG_CODE,
      lat: b.LAT,
      lng: b.LONG,
      image: imagesData.find((img) => img.building_uuid === b.uuid)?.image_url,
      rooms: roomsData
        .filter((r) => r.building_uuid === b.uuid)
        .map((r) => ({
          uuid: r.uuid,
          building_uuid: r.building_uuid,
          name: r.room_name,
          capacity: r.capacity,
          link: r.link,
          categoryIds: categoriesData.filter((c) => c.room_uuid === r.uuid).map((c) => c.categories_id),
        })),
    }))
    .filter((b) => b.rooms.length > 0);
};

export const fetchPOIs = async (): Promise<POI[]> => {
  // const { data: poiData, error: poiError } = await supabase.from('POI_test').select('*');
  // if (poiError) throw poiError;

  // return poiData
  //   .map((p) => ({
  //     id: p.POI_ID,
  //     name: p.PLACENAME,
  //     serviceType: p.SERVICE_TYPE,
  //     url: p.URL,
  //     lat: p.LAT,
  //     lng: p.LONG,
  //   }))
  //   .filter((p) => p.serviceType === 'library');
  return [];
};
