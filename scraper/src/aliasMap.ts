export interface ResolvedLocation {
  bldgCode: string;
  roomNumber: string;
}

/**
 * Resolve a Scientia "List Timetable" Location cell into a building code + room.
 *
 * The report's Location column already uses UBC building CODES (not full names),
 * e.g. "ALRD B101", "BIOL 1000", "IBLC 182" — the first whitespace-separated
 * token is the bldg_code and the remainder is the room number. (Confirmed: the
 * codes it emits are already the ones UBSeats uses, e.g. IBLC not IKB, MCML not
 * MCLM, so no name-alias map is needed.)
 *
 * Returns null for anything that isn't in "<CODE> <room>" shape, so malformed
 * cells are collected as unmatched rather than silently mis-parsed. The building
 * code itself is validated against the live buildings table later, at write time
 * (planRoomSync throws on an unknown code).
 */
export function resolveLocation(location: string): ResolvedLocation | null {
  const match = location.trim().match(/^([A-Za-z0-9]{2,6})\s+(\S.*)$/);
  if (!match) return null;
  const bldgCode = match[1].toUpperCase();
  const roomNumber = match[2].replace(/\s+/g, '').toUpperCase();
  if (!roomNumber) return null;
  return { bldgCode, roomNumber };
}
