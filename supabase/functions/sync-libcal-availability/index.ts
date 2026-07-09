import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { parseAvailability } from "./parseAvailability.ts";
import { fetchLibcalSlots } from "./libcalClient.ts";

const LIBCAL_HOSTS = ["libcal.library.ubc.ca", "amsubc.libcal.com"];
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 500;

interface LibcalRoom {
  uuid: string;
  host: string;
  spaceId: string;
}

function parseLibcalRooms(rows: { uuid: string; link: string | null }[]): LibcalRoom[] {
  const rooms: LibcalRoom[] = [];
  for (const row of rows) {
    if (!row.link) continue;
    for (const host of LIBCAL_HOSTS) {
      const match = row.link.match(new RegExp(`^https://${host}/space/(\\d+)`));
      if (match) {
        rooms.push({ uuid: row.uuid, host, spaceId: match[1] });
        break;
      }
    }
  }
  return rooms;
}

async function processRoom(supabase: SupabaseClient, room: LibcalRoom): Promise<void> {
  try {
    const slots = await fetchLibcalSlots(room.host, room.spaceId, new Date());
    const result = parseAvailability(slots, new Date());
    const { error } = await supabase.from("room_availability").upsert({
      room_uuid: room.uuid,
      is_available_now: result.isAvailableNow,
      available_until: result.availableUntil,
      next_available_at: result.nextAvailableAt,
      checked_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`upsert failed for room ${room.uuid}:`, error.message);
    }
  } catch (err) {
    console.error(`fetch/parse failed for room ${room.uuid} (space ${room.spaceId}):`, err);
  }
}

async function processInBatches(rooms: LibcalRoom[], supabase: SupabaseClient): Promise<void> {
  for (let i = 0; i < rooms.length; i += CONCURRENCY) {
    const batch = rooms.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((room) => processRoom(supabase, room)));
    if (i + CONCURRENCY < rooms.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.from("building_rooms").select("uuid, link").not("link", "is", null);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rooms = parseLibcalRooms(data ?? []);
  await processInBatches(rooms, supabase);

  return new Response(JSON.stringify({ processed: rooms.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
