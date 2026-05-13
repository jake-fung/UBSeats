export type CategoryType = 'library' | 'cafe' | 'quiet' | 'outdoor' | 'group';

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

export interface OpeningHours {
  monOpen: string;
  tueOpen: string;
  wedOpen: string;
  thuOpen: string;
  friOpen: string;
  satOpen: string;
  sunOpen: string;
  monClose: string;
  tueClose: string;
  wedClose: string;
  thuClose: string;
  friClose: string;
  satClose: string;
  sunClose: string;
}

export interface StudySpot {
  id: number;
  googleMapsPlaceId: string;
  name: string;
  description: string;
  categories: CategoryType[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  images: string[];
  hours: {
    periods: OpeningHours;
    open24: boolean;
    peakHours: string[];
  };
  amenities: string[];
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

export interface Building {
  uuid: string;
  name: string;
  primaryAddress: string;
  lat: number;
  lng: number;
}
