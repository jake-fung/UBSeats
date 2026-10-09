export type CategoriesTable = {
  Row: {
    color: string;
    icon: string;
    id: string;
    name: string;
  };
  Insert: {
    color: string;
    icon: string;
    id: string;
    name: string;
  };
  Update: {
    color?: string;
    icon?: string;
    id?: string;
    name?: string;
  };
  Relationships: [];
};

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

export interface Category {
  id: CategoryType;
  name: string;
  icon: string;
  color: string;
}

export interface Filter {
  category?: CategoryType;
}
