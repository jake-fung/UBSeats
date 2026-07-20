export interface ExistingRoom {
  uuid: string;
  building_uuid: string;
  room_name: string | null;
  source_key: string | null;
}

export interface ScrapedRoom {
  source_key: string;
  bldg_code: string;
  room_number: string;
}

export interface RoomSyncPlan {
  matched: Map<string, string>; // source_key -> building_rooms.uuid
  toInsert: ScrapedRoom[];
  skippedManual: { source_key: string; existingRoomUuid: string }[];
}

const trailingToken = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toUpperCase();
};

export function planRoomSync(
  scraped: ScrapedRoom[],
  existing: ExistingRoom[],
  buildingUuidByCode: Map<string, string>,
): RoomSyncPlan {
  const bySourceKey = new Map(existing.filter((r) => r.source_key).map((r) => [r.source_key as string, r]));
  // Manual rows (source_key null) indexed by building + trailing room token; this is
  // what protects the 7 IBLC LibCal rooms and any hand-entered row from duplication.
  const manualByBuildingToken = new Map<string, ExistingRoom>();
  for (const r of existing) {
    if (r.source_key || !r.room_name) continue;
    manualByBuildingToken.set(`${r.building_uuid}|${trailingToken(r.room_name)}`, r);
  }

  const seen = new Set<string>();
  const plan: RoomSyncPlan = { matched: new Map(), toInsert: [], skippedManual: [] };

  for (const s of scraped) {
    if (seen.has(s.source_key)) continue;
    seen.add(s.source_key);

    const hit = bySourceKey.get(s.source_key);
    if (hit) {
      plan.matched.set(s.source_key, hit.uuid);
      continue;
    }
    const buildingUuid = buildingUuidByCode.get(s.bldg_code);
    if (!buildingUuid) throw new Error(`bldg_code ${s.bldg_code} is not in the buildings table — fix aliasMap.ts`);
    const manual = manualByBuildingToken.get(`${buildingUuid}|${s.room_number.toUpperCase()}`);
    if (manual) {
      plan.skippedManual.push({ source_key: s.source_key, existingRoomUuid: manual.uuid });
      continue;
    }
    plan.toInsert.push(s);
  }
  return plan;
}
