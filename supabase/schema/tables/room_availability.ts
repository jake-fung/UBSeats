import type { TimeSlot } from '@/utils/hoursUtils';

export type RoomAvailabilityTable = {
  Row: {
    available_until: string | null;
    checked_at: string;
    is_available_now: boolean;
    next_available_at: string | null;
    room_uuid: string;
    slots?: TimeSlot[];
  };
  Insert: {
    available_until?: string | null;
    checked_at?: string;
    is_available_now: boolean;
    next_available_at?: string | null;
    room_uuid: string;
    slots?: string[];
  };
  Update: {
    available_until?: string | null;
    checked_at?: string;
    is_available_now?: boolean;
    next_available_at?: string | null;
    room_uuid?: string;
    slots?: string[];
  };
  Relationships: [
    {
      foreignKeyName: 'room_availability_room_uuid_fkey';
      columns: ['room_uuid'];
      isOneToOne: true;
      referencedRelation: 'building_rooms';
      referencedColumns: ['uuid'];
    },
  ];
};

export interface RoomAvailability {
  isAvailableNow: boolean;
  availableUntil: string | null;
  nextAvailableAt: string | null;
  checkedAt: string | null;
  scrapedAt: string | null;
  slots: TimeSlot[];
}
