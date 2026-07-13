import { TimeSlot } from "@/utils/hoursUtils";

export type CategoryType = 'library' | 'cafe' | 'quiet' | 'bookable';

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
}

export interface Room {
  uuid: string;
  building_uuid: string;
  library_id?: string | null;
  name: string;
  capacity: number | null;
  link: string;
  categoryIds?: string[];
  notes?: Note[];
  image?: string;
  hours?: DayHours[];
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

export interface Library {
  id: string;
  buildingUuid: string;
  name: string;
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
  library: Library | null;
}
