import { assertEquals, assertThrows } from "jsr:@std/assert";
import { extractRoomCode, parseMrbsPage } from "./mrbsClient.ts";

const FIXTURE_HTML = `
<table class="dwm_main" id="day_main" data-resolution="1800">
<thead data-slots="[[[1784037600,1784039400],[1784039400,1784041200],[1784041200,1784043000]]]" data-timeline-vertical="false" data-timeline-full="true">
<tr>
<th class="first_last">Time</th>
<th data-room="101"><a href="index.php?view=week&amp;view_all=0&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101" title = "View Week

Test Room">HA 001<span class="capacity">4</span></a></th>
<th data-room="102"><a href="index.php?view=week&amp;view_all=0&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102" title = "View Week

Test Room">HA 002<span class="capacity">4</span></a></th>
</tr>
</thead>
<tbody>
<tr>
<th data-seconds="25200"><a href="index.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;timetohighlight=25200" title="Highlight this line">07:00</a></th>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;hour=7&amp;minute=0" aria-label="Create a new booking"></a></td>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102&amp;hour=7&amp;minute=0" aria-label="Create a new booking"></a></td>
</tr>
<tr>
<th data-seconds="27000"><a href="index.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;timetohighlight=27000" title="Highlight this line">07:30</a></th>
<td class="booked" rowspan="2"><div class="I booking multiday_start multiday_end"><a href="view_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;id=1" title="Test User &lt;test@example.com&gt;" class="I" data-id="1" data-type="I">Test Booking</a></div></td>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102&amp;hour=7&amp;minute=30" aria-label="Create a new booking"></a></td>
</tr>
<tr>
<th data-seconds="28800"><a href="index.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;timetohighlight=28800" title="Highlight this line">08:00</a></th>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102&amp;hour=8&amp;minute=0" aria-label="Create a new booking"></a></td>
</tr>
</tbody>
</table>
`;

Deno.test("extractRoomCode takes the trailing whitespace-separated token", () => {
  assertEquals(extractRoomCode("ANGU – Room 092"), "092");
  assertEquals(extractRoomCode("ANGU – Room 191A"), "191A");
  assertEquals(extractRoomCode("DLAM – CLC Room 202"), "202");
});

Deno.test("extractRoomCode throws on blank input", () => {
  assertThrows(() => extractRoomCode("   "), Error, "Could not extract a room code");
});

Deno.test("parseMrbsPage reads room headers in column order", () => {
  const page = parseMrbsPage(FIXTURE_HTML);
  assertEquals(page.rooms, [
    { roomId: "101", code: "001" },
    { roomId: "102", code: "002" },
  ]);
});

Deno.test("parseMrbsPage reconstructs slots across a rowspan-ed booking", () => {
  const page = parseMrbsPage(FIXTURE_HTML);

  assertEquals(page.slotsByRoomId.get("101"), [
    { start: "2026-07-14T14:00:00.000Z", end: "2026-07-14T14:30:00.000Z", available: true },
    { start: "2026-07-14T14:30:00.000Z", end: "2026-07-14T15:30:00.000Z", available: false },
  ]);

  assertEquals(page.slotsByRoomId.get("102"), [
    { start: "2026-07-14T14:00:00.000Z", end: "2026-07-14T14:30:00.000Z", available: true },
    { start: "2026-07-14T14:30:00.000Z", end: "2026-07-14T15:00:00.000Z", available: true },
    { start: "2026-07-14T15:00:00.000Z", end: "2026-07-14T15:30:00.000Z", available: true },
  ]);
});

Deno.test("parseMrbsPage throws when the day table is missing", () => {
  assertThrows(() => parseMrbsPage("<html><body>not a booking page</body></html>"), Error, "day_main");
});
