export type CategoryType = 'library' | 'cafe' | 'quiet' | 'bookable';

export interface Category {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export interface Filter {
  category?: CategoryType;
  rating?: number;
  noise?: number;
  wifi?: number;
  seating?: number;
  amenities?: string[];
  open?: boolean;
  search?: string;
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
  capacity: number;
  link: string;
  categoryIds?: string[];
  notes?: Note[];
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
  library: Library;
}
