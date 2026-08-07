import { assertEquals } from "jsr:@std/assert";
import { classifyRooms } from "./roomSync.ts";

Deno.test("classifyRooms routes LibCal links by extracting their space id", () => {
  const result = classifyRooms([
    { uuid: "a", link: "https://libcal.library.ubc.ca/space/12057", room_name: "IKBLC - Room 1" },
    { uuid: "b", link: "https://amsubc.libcal.com/space/999", room_name: "Nest - Room 2" },
  ]);
  assertEquals(result, [
    { kind: "libcal", uuid: "a", host: "libcal.library.ubc.ca", spaceId: "12057" },
    { kind: "libcal", uuid: "b", host: "amsubc.libcal.com", spaceId: "999" },
  ]);
});

Deno.test("classifyRooms routes MRBS links by base URL, carrying room_name through for later matching", () => {
  const result = classifyRooms([
    { uuid: "c", link: "https://booking.sauder.ubc.ca/ugr/", room_name: "ANGU – Room 092" },
    { uuid: "d", link: "https://booking.sauder.ubc.ca/clc/", room_name: "DLAM – CLC Room 202" },
  ]);
  assertEquals(result, [
    { kind: "mrbs", uuid: "c", baseUrl: "https://booking.sauder.ubc.ca/ugr/", roomName: "ANGU – Room 092" },
    { kind: "mrbs", uuid: "d", baseUrl: "https://booking.sauder.ubc.ca/clc/", roomName: "DLAM – CLC Room 202" },
  ]);
});

Deno.test("classifyRooms skips rooms with no link, an unrecognized link, or a missing room_name for MRBS", () => {
  const result = classifyRooms([
    { uuid: "e", link: null, room_name: "Some Room" },
    { uuid: "f", link: "https://example.com/unrelated", room_name: "Some Room" },
    { uuid: "g", link: "https://booking.sauder.ubc.ca/ugr/", room_name: null },
  ]);
  assertEquals(result, []);
});
