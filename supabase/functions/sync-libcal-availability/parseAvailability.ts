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

  const current = sorted.find(
    (s) => new Date(s.start).getTime() <= nowMs && nowMs < new Date(s.end).getTime(),
  );

  if (!current || current.available) {
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
