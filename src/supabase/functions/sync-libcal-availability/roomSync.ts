import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { parseAvailability } from './parseAvailability.ts';
import { fetchLibcalSlots } from './libcalClient.ts';
import { fetchMrbsSlots } from './mrbsClient.ts';

const LIBCAL_HOSTS = ['libcal.library.ubc.ca', 'amsubc.libcal.com'];
const MRBS_BASE_URLS = ['https://booking.sauder.ubc.ca/ugr/', 'https://booking.sauder.ubc.ca/clc/'];
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 500;

export interface BuildingRoomRow {
  uuid: string;
  link: string | null;
  room_name: string | null;
}

export type SourcedRoom =
  | { kind: 'libcal'; uuid: string; host: string; spaceId: string }
  | { kind: 'mrbs'; uuid: string; baseUrl: string; roomName: string };

export function classifyRooms(rows: BuildingRoomRow[]): SourcedRoom[] {
  const rooms: SourcedRoom[] = [];

  for (const row of rows) {
    if (!row.link) continue;

    let matched = false;
    for (const host of LIBCAL_HOSTS) {
      const match = row.link.match(new RegExp(`^https://${host}/space/(\\d+)`));
      if (match) {
        rooms.push({ kind: 'libcal', uuid: row.uuid, host, spaceId: match[1] });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const baseUrl = MRBS_BASE_URLS.find((url) => row.link!.startsWith(url));
    if (baseUrl && row.room_name) {
      rooms.push({ kind: 'mrbs', uuid: row.uuid, baseUrl, roomName: row.room_name });
    }
  }

  return rooms;
}

async function processRoom(supabase: SupabaseClient, room: SourcedRoom): Promise<void> {
  try {
    const slots =
      room.kind === 'libcal'
        ? await fetchLibcalSlots(room.host, room.spaceId, new Date())
        : await fetchMrbsSlots(room.baseUrl, room.roomName, new Date());
    const result = parseAvailability(slots, new Date());
    const { error } = await supabase.from('room_availability').upsert({
      room_uuid: room.uuid,
      is_available_now: result.isAvailableNow,
      available_until: result.availableUntil,
      next_available_at: result.nextAvailableAt,
      slots,
      checked_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`upsert failed for room ${room.uuid}:`, error.message);
    }
  } catch (err) {
    console.error(`fetch/parse failed for room ${room.uuid}:`, err);
  }
}

export async function processInBatches(rooms: SourcedRoom[], supabase: SupabaseClient): Promise<void> {
  for (let i = 0; i < rooms.length; i += CONCURRENCY) {
    const batch = rooms.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((room) => processRoom(supabase, room)));
    if (i + CONCURRENCY < rooms.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
}
