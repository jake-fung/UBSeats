export interface Slot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
}

export interface AvailabilityResult {
  isAvailableNow: boolean;
  availableUntil: string | null;
  nextAvailableAt: string | null;
}

export function parseAvailability(slots: Slot[], now: Date): AvailabilityResult {
  const sorted = [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const nowMs = now.getTime();

  const current = sorted.find((s) => new Date(s.start).getTime() <= nowMs && nowMs < new Date(s.end).getTime());

  // No slot covers `now`, so the room is outside its operating window — closed, not free.
  // bookingsToSlots emits nothing outside 07:00–22:00, and a LibCal grid stops at the
  // room's bookable hours, so a missing slot is the closed signal. An empty
  // slot list lands here too, which reads as "no grid is held for this room".
  if (!current) {
    const nextOpen = sorted.find((s) => s.available && new Date(s.start).getTime() >= nowMs);
    return {
      isAvailableNow: false,
      availableUntil: null,
      nextAvailableAt: nextOpen ? nextOpen.start : null,
    };
  }

  if (current.available) {
    const nextBooked = sorted.find((s) => !s.available && new Date(s.start).getTime() >= nowMs);
    return {
      isAvailableNow: true,
      availableUntil: nextBooked ? nextBooked.start : null,
      nextAvailableAt: null,
    };
  }

  // Booked right now. LibCal reports back-to-back bookings as separate slots, so walk
  // forward while each next slot starts exactly where the previous one ended.
  let endOfBooking = current.end;
  for (const slot of sorted) {
    if (!slot.available && new Date(slot.start).getTime() === new Date(endOfBooking).getTime()) {
      endOfBooking = slot.end;
    }
  }

  return {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: endOfBooking,
  };
}
