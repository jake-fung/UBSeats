import type { Slot } from './parseAvailability.ts';

export interface MrbsRoomColumn {
  roomId: string;
  code: string;
}

export interface MrbsPage {
  rooms: MrbsRoomColumn[];
  slotsByRoomId: Map<string, Slot[]>;
}

/**
 * MRBS room labels and this codebase's `building_rooms.room_name` both end in the
 * room's distinguishing code as their last whitespace-separated token — e.g. header
 * label "HA 092" / "CLC 202" vs DB name "ANGU – Room 092" / "DLAM – CLC Room 202".
 * Matching on that trailing token sidesteps the "HA" vs "ANGU" building-code mismatch
 * between MRBS's internal naming and this codebase's, without needing a lookup table.
 */
export function extractRoomCode(name: string): string {
  const token = name.trim().split(/\s+/).pop();
  if (!token) {
    throw new Error(`Could not extract a room code from "${name}"`);
  }
  return token.toUpperCase();
}

/**
 * MRBS's day-view table represents a booking spanning multiple half-hour rows with a
 * single `rowspan`-ed `<td>`, omitting that column's `<td>` entirely from the rows it
 * spans over. Reconstructing per-room slots means walking the table as a grid: tracking,
 * per column, how many upcoming rows are already spoken for by an earlier row's rowspan,
 * and only consuming a new `<td>` from a row when that column isn't currently pending.
 *
 * The table's `<thead data-slots="[[[start,end],...]]">` gives the exact UTC instant
 * boundaries for every row directly (unlike LibCal, no wall-clock/DST math is needed) —
 * the outer array wraps a single day's list of `[start, end]` pairs.
 */
export function parseMrbsPage(html: string): MrbsPage {
  const tableMatch = /<table class="dwm_main" id="day_main"[^>]*>(.*?)<\/table>/s.exec(html);
  if (!tableMatch) {
    throw new Error('Could not find MRBS day table (id="day_main") in page');
  }
  const tableHtml = tableMatch[1];

  const slotsMatch = /data-slots="([^"]*)"/.exec(tableHtml);
  if (!slotsMatch) {
    throw new Error('Could not find data-slots attribute in MRBS page');
  }
  const parsedSlots = JSON.parse(slotsMatch[1]) as [number, number][][];
  const daySlots = parsedSlots[0];
  if (!daySlots || daySlots.length === 0) {
    throw new Error('MRBS data-slots attribute contained no slots for the requested day');
  }

  const headerMatch = /<thead[^>]*>(.*?)<\/thead>/s.exec(tableHtml);
  if (!headerMatch) {
    throw new Error('Could not find MRBS table header in page');
  }
  const headerRegex =
    /<th data-room="(\d+)"><a href="[^"]*"\s+title\s*=\s*"[^"]*">([^<]+)<span class="capacity">/g;
  const rooms: MrbsRoomColumn[] = [];
  for (const match of headerMatch[1].matchAll(headerRegex)) {
    rooms.push({ roomId: match[1], code: extractRoomCode(match[2]) });
  }
  if (rooms.length === 0) {
    throw new Error('Could not find any room columns in MRBS page header');
  }

  const bodyMatch = /<tbody>(.*?)<\/tbody>/s.exec(tableHtml);
  if (!bodyMatch) {
    throw new Error('Could not find MRBS table body in page');
  }
  const rowHtmls = [...bodyMatch[1].matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)].map((m) => m[1]);
  if (rowHtmls.length !== daySlots.length) {
    throw new Error(
      `MRBS row count (${rowHtmls.length}) does not match data-slots count (${daySlots.length})`,
    );
  }

  const slotsByRoomId = new Map<string, Slot[]>(rooms.map((r) => [r.roomId, []]));
  const cellRegex = /<td class="(new|booked)"(?: rowspan="(\d+)")?[^>]*>/g;
  const pendingRows = new Array(rooms.length).fill(0);

  for (let rowIndex = 0; rowIndex < rowHtmls.length; rowIndex++) {
    const expectedCells = pendingRows.filter((n) => n === 0).length;
    const cells = [...rowHtmls[rowIndex].matchAll(cellRegex)];
    if (cells.length !== expectedCells) {
      throw new Error(
        `Unexpected MRBS row shape at row ${rowIndex}: expected ${expectedCells} cells, found ${cells.length}`,
      );
    }

    let cellCursor = 0;
    for (let col = 0; col < rooms.length; col++) {
      if (pendingRows[col] > 0) {
        pendingRows[col]--;
        continue;
      }

      const cell = cells[cellCursor++];
      const cssClass = cell[1];
      const span = cell[2] ? Number(cell[2]) : 1;
      const [start] = daySlots[rowIndex];
      const [, end] = daySlots[rowIndex + span - 1];

      slotsByRoomId.get(rooms[col].roomId)!.push({
        start: new Date(start * 1000).toISOString(),
        end: new Date(end * 1000).toISOString(),
        available: cssClass === 'new',
      });

      if (span > 1) {
        pendingRows[col] = span - 1;
      }
    }
  }

  return { rooms, slotsByRoomId };
}
