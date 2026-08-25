import { supabase } from '@/supabase/client';
import {
  Building,
  Category,
  DayHours,
  FeedbackInput,
  Note,
  Room,
  RoomAvailability,
  Venue,
} from '@/supabase/schema/types';
import type { Database } from '@/supabase/schema/database.types';
import { validateCategoryType } from '@/utils/spotUtils';
import { bookingsToSlots, classroomWindowCoversDate, BookingInterval } from '@/utils/hoursUtils';
import { parseAvailability } from '@/supabase/functions/sync-libcal-availability/parseAvailability';

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
    id: validateCategoryType(item.id)!,
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
    venuesData,
    venueHoursData,
    venueImagesData,
    roomImagesData,
  ] = await Promise.all([
    selectAll('buildings'),
    selectAll('building_images'),
    selectAll('building_rooms'),
    selectAll('room_categories'),
    selectAll('room_notes'),
    selectAll('notes'),
    selectAll('building_hours'),
    selectAll('venues'),
    selectAll('venue_hours'),
    selectAll('venue_images'),
    selectAll('room_images'),
  ]);

  const imageMap = buildImageMap(imagesData, (img) => img.building_uuid);
  const venueImagesMap = buildImageMap(venueImagesData, (img) => img.venue_id);
  const roomImagesMap = buildImageMap(roomImagesData, (img) => img.room_uuid);

  const hoursMap = buildHoursMap(hoursData, (h) => h.building_uuid);
  const venueHoursMap = buildHoursMap(venueHoursData, (h) => h.venue_id);

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
  const venueRoomsMap = new Map<string, Room[]>();
  roomsData.forEach((r) => {
    if (!r.building_uuid) return;
    const categoryIds = categoriesMap.get(r.uuid) ?? [];
    const room: Room = {
      uuid: r.uuid,
      building_uuid: r.building_uuid,
      venue_id: r.venue_id ?? null,
      name: r.room_name,
      capacity: r.capacity,
      link: r.link,
      categoryIds,
      notes: notesMap.get(r.uuid) ?? [],
      image: roomImagesMap.get(r.uuid),
    };
    if (r.venue_id) {
      const list = venueRoomsMap.get(r.venue_id) ?? [];
      list.push(room);
      list.sort((a, b) => a.name.localeCompare(b.name));
      venueRoomsMap.set(r.venue_id, list);
    } else {
      const list = roomsMap.get(r.building_uuid) ?? [];
      list.push(room);
      list.sort((a, b) => a.name.localeCompare(b.name));
      roomsMap.set(r.building_uuid, list);
    }
  });

  const venuesMap = new Map<string, Venue[]>();
  venuesData.forEach((v) => {
    if (!v.building_uuid) return;
    const list = venuesMap.get(v.building_uuid) ?? [];
    list.push({
      id: v.id,
      buildingUuid: v.building_uuid,
      name: v.name,
      kind: v.kind === 'cafe' ? 'cafe' : 'library',
      hours: venueHoursMap.get(v.id) ?? [],
      rooms: venueRoomsMap.get(v.id) ?? [],
      image: venueImagesMap.get(v.id),
    });
    list.sort((a, b) => a.name.localeCompare(b.name));
    venuesMap.set(v.building_uuid, list);
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
      venues: venuesMap.get(b.uuid) ?? [],
    }))
    .filter((b) => b.rooms.length > 0 || b.venues.some((v) => v.rooms.length > 0));
}

const STALE_AFTER_MS = 30 * 60 * 1000;

const BOOKINGS_PAGE_SIZE = 1000;

/** Today's classroom bookings, paginated past PostgREST's 1000-row cap. */
async function selectClassroomBookingsForDay(
  dayStart: Date,
  dayEnd: Date,
): Promise<Tables['classroom_bookings']['Row'][]> {
  const rows: Tables['classroom_bookings']['Row'][] = [];
  for (let from = 0; ; from += BOOKINGS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('classroom_bookings')
      .select('*')
      .lt('starts_at', dayEnd.toISOString())
      .gt('ends_at', dayStart.toISOString())
      .order('starts_at')
      .order('id')
      .range(from, from + BOOKINGS_PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < BOOKINGS_PAGE_SIZE) break;
  }
  return rows;
}

/**
 * Availability for classroom-tagged rooms, derived by inverting today's
 * schedule bookings. Returns an empty map when there is no scrape whose
 * current+next-week window still covers today (stale data must not render
 * as a fully free day).
 */
export async function fetchClassroomAvailability(now: Date): Promise<Map<string, RoomAvailability>> {
  const { data: latest, error: latestError } = await supabase
    .from('classroom_bookings')
    .select('scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(1);
  if (latestError) throw latestError;
  if (!latest?.length || !classroomWindowCoversDate(latest[0].scraped_at, now)) return new Map();

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [tagsResult, bookings] = await Promise.all([
    supabase.from('room_categories').select('room_uuid').eq('categories_id', 'classroom'),
    selectClassroomBookingsForDay(dayStart, dayEnd),
  ]);
  if (tagsResult.error) throw tagsResult.error;

  const bookingsByRoom = new Map<string, BookingInterval[]>();
  bookings.forEach((b) => {
    const list = bookingsByRoom.get(b.room_uuid) ?? [];
    list.push({ startsAt: b.starts_at, endsAt: b.ends_at });
    bookingsByRoom.set(b.room_uuid, list);
  });

  const map = new Map<string, RoomAvailability>();
  (tagsResult.data ?? []).forEach(({ room_uuid }) => {
    if (!room_uuid) return;
    const slots = bookingsToSlots(bookingsByRoom.get(room_uuid) ?? [], now);
    const summary = parseAvailability(slots, now);
    map.set(room_uuid, {
      isAvailableNow: summary.isAvailableNow,
      availableUntil: summary.availableUntil,
      nextAvailableAt: summary.nextAvailableAt,
      checkedAt: latest[0].scraped_at,
      slots,
    });
  });
  return map;
}

export async function fetchRoomAvailability(): Promise<Map<string, RoomAvailability>> {
  const now = new Date();
  // Classroom schedule data degrades gracefully: any failure (including the
  // table not existing before the migration lands) yields an empty base map.
  const map = await fetchClassroomAvailability(now).catch((err) => {
    console.error('classroom availability unavailable:', err);
    return new Map<string, RoomAvailability>();
  });

  const rows = await selectAll('room_availability');
  rows.forEach((row) => {
    if (now.getTime() - new Date(row.checked_at).getTime() > STALE_AFTER_MS) return;
    // Derive against the current clock instead of trusting row.is_available_now, which the
    // Edge Function computed at sync time and can lag by up to STALE_AFTER_MS. This is the
    // same derivation fetchClassroomAvailability performs, so bookable rooms and classrooms
    // share one definition of "available now" and cannot drift apart again.
    const slots = row.slots ?? [];
    const summary = parseAvailability(slots, now);
    map.set(row.room_uuid, {
      isAvailableNow: summary.isAvailableNow,
      availableUntil: summary.availableUntil,
      nextAvailableAt: summary.nextAvailableAt,
      checkedAt: row.checked_at,
      slots,
    });
  });
  return map;
}

/**
 * Insert one feedback submission.
 *
 * The `feedback` table is write-only from the browser: RLS grants INSERT but no
 * SELECT. That is why this must not chain `.select()` — the returning clause
 * would come back empty and supabase-js would surface it as an error even though
 * the write succeeded.
 *
 * Throws the PostgrestError on failure so the caller can keep the user's typed
 * message on screen instead of silently discarding it.
 */
export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    category: input.category,
    device: input.device,
    message: input.message,
  });
  if (error) throw error;
}
