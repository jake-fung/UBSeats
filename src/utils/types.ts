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

interface OpeningPeriod {
    open: {
        day: number;
        hour: number;
        minute: number;
    };
    close: {
        day: number;
        hour: number;
        minute: number;
    };
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
    noise: number; // 1-5 scale (1: silent, 5: loud)
    wifi: number; // 1-5 scale (1: none, 5: excellent)
    seating: number; // 1-5 scale (1: limited, 5: abundant)
    hours: {
        openNow: boolean;
        periods: OpeningPeriod[];
        weekdayDescriptions: string[];
        peakHours: string[];
    };
    amenities: string[];
}

export interface Review {
    id: string;
    spotId: number;
    user: {
        name: string;
        avatar: string;
    };
    date: string;
    time: string;
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
