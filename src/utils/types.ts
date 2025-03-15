
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

export interface StudySpot {
  id: string;
  name: string;
  description: string;
  categories: CategoryType[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  images: string[];
  rating: number;
  reviewCount: number;
  noise: number; // 1-5 scale (1: silent, 5: loud)
  wifi: number; // 1-5 scale (1: none, 5: excellent)
  seating: number; // 1-5 scale (1: limited, 5: abundant)
  hours: {
    open: string;
    close: string;
    peakHours: string[];
  };
  amenities: string[];
}

export interface Review {
  id: string;
  spotId: string;
  user: {
    name: string;
    avatar: string;
  };
  date: string;
  rating: number;
  content: string;
  helpful: number;
  categories: {
    comfort: number;
    noise: number;
    amenities: number;
  };
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
