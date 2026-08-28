import { TimeSlot } from '@/utils/hoursUtils';

export type CategoryType =
  | 'library'
  | 'cafe'
  | 'quiet'
  | 'bookable'
  | 'classroom'
  | 'workstation'
  | 'open_buildings'
  | 'favourites'
  | 'now_available_rooms';

export type FeedbackCategory = 'bug' | 'feature' | 'spot' | 'other';

export type FeedbackDevice = 'iphone' | 'android' | 'ipad' | 'desktop';

export interface FeedbackInput {
  category: FeedbackCategory;
  device: FeedbackDevice;
  message: string;
}

export interface Category {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
}

export interface Filter {
  category?: CategoryType;
}

export interface Note {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  icon: string | null;
}

export interface Room {
  uuid: string;
  building_uuid: string;
  venue_id?: string | null;
  name: string;
  capacity: number | null;
  link: string;
  categoryIds?: string[];
  notes?: Note[];
  image?: string;
}

export interface RoomAvailability {
  isAvailableNow: boolean;
  availableUntil: string | null;
  nextAvailableAt: string | null;
  checkedAt: string;
  slots: TimeSlot[];
}

export interface DayHours {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
}

export type VenueKind = 'library';

/** A named place inside a building with its own hours and photo: a library or a café. */
export interface Venue {
  id: string;
  buildingUuid: string;
  name: string;
  kind: VenueKind;
  hours: DayHours[];
  rooms: Room[];
  image: string | undefined;
}

export interface Building {
  uuid: string;
  name: string;
  code: string;
  primaryAddress: string;
  lat: number;
  lng: number;
  image: string | undefined;
  rooms: Room[];
  hours: DayHours[];
  venues: Venue[];
}
