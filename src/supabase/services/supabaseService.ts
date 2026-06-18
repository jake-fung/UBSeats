import { supabase } from '@/supabase/client';
import { Building, Category, DayHours, Library, Note, Room } from '@/supabase/schema/types';
import type { Database } from '@/supabase/schema/database.types';
import { validateCategoryType } from '@/utils/spotUtils';

type Tables = Database['public']['Tables'];

/**
 * Fetch every row of a table, throwing on error. Rows are typed from the generated
 * schema. The `unknown` hop is the standard escape hatch for accessing a table via a
 * generic parameter (supabase-js only narrows `select('*')` for string-literal names).
 */
async function selectAll<T extends keyof Tables>(table: T): Promise<Tables[T]['Row'][]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data ?? []) as unknown as Tables[T]['Row'][];
}

/**
 * Group `*_hours` rows into a `Map<key, DayHours[]>`. Shared by building, library,
 * and café hours, which differ only in the column that holds the owning id.
 */
function buildHoursMap<T extends { day_of_week: number; opens_at: string | null; closes_at: string | null }>(
  rows: T[],
  keyOf: (row: T) => string | null,
): Map<string, DayHours[]> {
  const map = new Map<string, DayHours[]>();
  rows.forEach((row) => {
    const key = keyOf(row);
    if (!key) return;
    const list = map.get(key) ?? [];
    list.push({ dayOfWeek: row.day_of_week, opensAt: row.opens_at, closesAt: row.closes_at });
    map.set(key, list);
  });
  return map;
}

/**
 * Group `*_images` rows into a `Map<key, image_url>`. Shared by building, library,
 * and café images (last write wins, mirroring the original per-entity logic).
 */
function buildImageMap<T extends { image_url: string | null }>(
  rows: T[],
  keyOf: (row: T) => string | null,
): Map<string, string> {
  const map = new Map<string, string>();
  rows.forEach((row) => {
    const key = keyOf(row);
    if (key && row.image_url) map.set(key, row.image_url);
  });
  return map;
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await selectAll('categories');
  return data.map((item) => ({
    id: validateCategoryType(item.id) || 'library',
    name: item.name,
    icon: item.icon,
    color: item.color,
  }));
}

export async function fetchBuildings(): Promise<Building[]> {
  const [
    buildingData,
    imagesData,
    roomsData,
    categoriesData,
    roomNotesData,
    noteDefsData,
    hoursData,
    librariesData,
    libHoursData,
    libImagesData,
    roomImagesData,
  ] = await Promise.all([
    selectAll('buildings'),
    selectAll('building_images'),
    selectAll('building_rooms'),
    selectAll('room_categories'),
    selectAll('room_notes'),
    selectAll('notes'),
    selectAll('building_hours'),
    selectAll('libraries'),
    selectAll('library_hours'),
    selectAll('library_images'),
    selectAll('room_images'),
  ]);

  const imageMap = buildImageMap(imagesData, (img) => img.building_uuid);
  const libImagesMap = buildImageMap(libImagesData, (img) => img.library_id);
  const roomImagesMap = buildImageMap(roomImagesData, (img) => img.room_uuid);

  const hoursMap = buildHoursMap(hoursData, (h) => h.building_uuid);
  const libHoursMap = buildHoursMap(libHoursData, (h) => h.library_id);

  const categoriesMap = new Map<string, string[]>();
  categoriesData.forEach((c) => {
    if (c.room_uuid && c.categories_id) {
      const list = categoriesMap.get(c.room_uuid) ?? [];
      list.push(validateCategoryType(c.categories_id));
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
    const categoryIds = categoriesMap.get(r.uuid) ?? [];
    const room: Room = {
      uuid: r.uuid,
      building_uuid: r.building_uuid,
      library_id: r.library_id ?? null,
      name: r.room_name,
      capacity: r.capacity,
      link: r.link,
      categoryIds,
      notes: notesMap.get(r.uuid) ?? [],
      image: roomImagesMap.get(r.uuid),
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

  const librariesMap = new Map<string, Library>();
  librariesData.forEach((lib) => {
    if (!lib.building_uuid) return;
    librariesMap.set(lib.building_uuid, {
      id: lib.id,
      buildingUuid: lib.building_uuid,
      name: lib.name,
      hours: libHoursMap.get(lib.id) ?? [],
      rooms: libRoomsMap.get(lib.id) ?? [],
      image: libImagesMap.get(lib.id),
    });
  });

  return buildingData
    .map((b) => ({
      uuid: b.uuid,
      name: b.name,
      primaryAddress: b.primary_address,
      code: b.bldg_code,
      lat: b.lat,
      lng: b.lng,
      image: imageMap.get(b.uuid),
      rooms: roomsMap.get(b.uuid) ?? [],
      hours: hoursMap.get(b.uuid) ?? [],
      library: librariesMap.get(b.uuid) ?? null,
    }))
    .filter((b) => (b.rooms && b.rooms.length > 0) || (b.library && b.library.rooms.length > 0));
}
