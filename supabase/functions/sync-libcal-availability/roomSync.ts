import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { parseAvailability } from './parseAvailability.ts';
import { fetchLibcalSlots } from './libcalClient.ts';

const LIBCAL_HOSTS = ['libcal.library.ubc.ca', 'amsubc.libcal.com'];
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 500;

export interface BuildingRoomRow {
  uuid: string;
  link: string | null;
}

export type SourcedRoom = { kind: 'libcal'; uuid: string; host: string; spaceId: string };

export function classifyRooms(rows: BuildingRoomRow[]): SourcedRoom[] {
  const rooms: SourcedRoom[] = [];

  for (const row of rows) {
    if (!row.link) continue;

    for (const host of LIBCAL_HOSTS) {
      const match = row.link.match(new RegExp(`^https://${host}/space/(\\d+)`));
      if (match) {
        rooms.push({ kind: 'libcal', uuid: row.uuid, host, spaceId: match[1] });
        break;
      }
    }
  }

  return rooms;
}

async function processRoom(supabase: SupabaseClient, room: SourcedRoom): Promise<void> {
  try {
    const slots = await fetchLibcalSlots(room.host, room.spaceId, new Date());
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
