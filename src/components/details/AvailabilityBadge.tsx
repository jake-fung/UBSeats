import { RoomAvailability } from '@/supabase/schema/types';

export interface AvailabilityBadgeProps {
  availability: RoomAvailability | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const AvailabilityBadge = ({ availability }: AvailabilityBadgeProps) => {
  if (!availability) return null;

  const label = availability.isAvailableNow
    ? availability.availableUntil
      ? `Available until ${formatTime(availability.availableUntil)}`
      : 'Available now'
    : availability.nextAvailableAt
      ? `Busy until ${formatTime(availability.nextAvailableAt)}`
      : 'Busy';

  return (
    <span
      className={
        availability.isAvailableNow
          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'
      }
    >
      {label}
    </span>
  );
};
