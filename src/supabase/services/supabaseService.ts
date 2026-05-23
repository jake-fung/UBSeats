import { supabase } from '@/supabase/client';
import { Amenity, Building, Category, DayHours, Library, Note, Room } from '@/supabase/schema/types';
import { validateCategoryType } from '@/utils/spotUtils';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw error;

  return data.map((item) => ({
    id: validateCategoryType(item.id) || 'library',
    name: item.name,
    icon: item.icon,
    color: item.color,
  }));
}

export async function fetchAmenities(): Promise<Amenity[]> {
  const { data, error } = await supabase.from('amenities').select('*');
  if (error) throw error;
  return data;
}

export async function fetchBuildings(): Promise<Building[]> {
  const [
    { data: buildingData, error: buildingError },
    { data: imagesData, error: imagesError },
    { data: roomsData, error: roomsError },
    { data: categoriesData, error: categoriesError },
    { data: roomNotesData, error: roomNotesError },
    { data: noteDefsData, error: noteDefsError },
    { data: hoursData, error: hoursError },
    { data: librariesData, error: librariesError },
    { data: libHoursData, error: libHoursError },
  ] = await Promise.all([
    supabase.from('buildings').select('*'),
    supabase.from('building_images').select('*'),
    supabase.from('building_rooms').select('*'),
    supabase.from('room_categories').select('*'),
    supabase.from('room_notes').select('*'),
    supabase.from('notes').select('*'),
    supabase.from('building_hours').select('*'),
    supabase.from('libraries').select('*'),
    supabase.from('library_hours').select('*'),
  ]);

  if (buildingError) throw buildingError;
  if (imagesError) throw imagesError;
  if (roomsError) throw roomsError;
  if (categoriesError) throw categoriesError;
  if (roomNotesError) throw roomNotesError;
  if (noteDefsError) throw noteDefsError;
  if (hoursError) throw hoursError;
  if (librariesError) throw librariesError;
  if (libHoursError) throw libHoursError;

  const imageMap = new Map<string, string>();
  imagesData.forEach((img) => {
    if (img.building_uuid && img.image_url) {
      imageMap.set(img.building_uuid, img.image_url);
    }
  });

  const categoriesMap = new Map<string, string[]>();
  categoriesData.forEach((c) => {
    if (c.room_uuid && c.categories_id) {
      const list = categoriesMap.get(c.room_uuid) ?? [];
      list.push(c.categories_id);
      categoriesMap.set(c.room_uuid, list);
    }
  });

  const noteDefsMap = new Map<string, Note>();
  noteDefsData.forEach((def) => {
    noteDefsMap.set(def.id, { id: def.id, name: def.name, color: def.color, description: def.description });
  });

  const notesMap = new Map<string, Note[]>();
  roomNotesData.forEach((r) => {
    const def = noteDefsMap.get(r.note_id);
    if (!r.room_uuid || !def) return;
    const list = notesMap.get(r.room_uuid) ?? [];
    list.push(def);
    notesMap.set(r.room_uuid, list);
  });

  const roomsMap = new Map<string, Room[]>();
  const libRoomsMap = new Map<string, Room[]>();
  roomsData.forEach((r) => {
    if (!r.building_uuid) return;
    const room: Room = {
      uuid: r.uuid,
      building_uuid: r.building_uuid,
      library_id: r.library_id ?? null,
      name: r.room_name,
      capacity: r.capacity,
      link: r.link,
      categoryIds: categoriesMap.get(r.uuid) ?? [],
      notes: notesMap.get(r.uuid) ?? [],
    };
    if (r.library_id) {
      const list = libRoomsMap.get(r.library_id) ?? [];
      list.push(room);
      list.sort((a, b) => a.name.localeCompare(b.name));
      libRoomsMap.set(r.library_id, list);
    } else {
      const list = roomsMap.get(r.building_uuid) ?? [];
      list.push(room);
      list.sort((a, b) => a.name.localeCompare(b.name));
      roomsMap.set(r.building_uuid, list);
    }
  });

  const hoursMap = new Map<string, DayHours[]>();
  hoursData.forEach((h) => {
    if (!h.building_uuid) return;
    const list = hoursMap.get(h.building_uuid) ?? [];
    list.push({ dayOfWeek: h.day_of_week, opensAt: h.opens_at, closesAt: h.closes_at });
    hoursMap.set(h.building_uuid, list);
  });

  const libHoursMap = new Map<string, DayHours[]>();
  libHoursData.forEach((h) => {
    if (!h.library_id) return;
    const list = libHoursMap.get(h.library_id) ?? [];
    list.push({ dayOfWeek: h.day_of_week, opensAt: h.opens_at, closesAt: h.closes_at });
    libHoursMap.set(h.library_id, list);
  });

  const librariesMap = new Map<string, Library>();
  librariesData.forEach((lib) => {
    if (!lib.building_uuid) return;
    librariesMap.set(lib.building_uuid, {
      id: lib.id,
      buildingUuid: lib.building_uuid,
      name: lib.name,
      hours: libHoursMap.get(lib.id) ?? [],
      rooms: libRoomsMap.get(lib.id) ?? [],
    });
  });

  return buildingData
    .map((b) => ({
      uuid: b.uuid,
      name: b.NAME,
      primaryAddress: b.PRIMARY_ADDRESS,
      code: b.BLDG_CODE,
      lat: b.LAT,
      lng: b.LONG,
      image: imageMap.get(b.uuid),
      rooms: roomsMap.get(b.uuid) ?? [],
      hours: hoursMap.get(b.uuid) ?? [],
      library: librariesMap.get(b.uuid) ?? null,
    }))
    .filter((b) => b.rooms.length > 0);
}
