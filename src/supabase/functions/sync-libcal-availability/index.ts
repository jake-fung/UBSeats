import { createClient } from 'jsr:@supabase/supabase-js@2';
import { classifyRooms, processInBatches } from '../roomSync.ts';
import { resetMrbsCache } from '../mrbsClient.ts';

Deno.serve(async () => {
  resetMrbsCache();

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data, error } = await supabase
    .from('building_rooms')
    .select('uuid, link, room_name')
    .not('link', 'is', null);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rooms = classifyRooms(data ?? []);
  await processInBatches(rooms, supabase);

  return new Response(JSON.stringify({ processed: rooms.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
