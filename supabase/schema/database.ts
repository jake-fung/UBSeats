import type { AmenitiesTable } from './tables/amenities';
import type { BuildingHoursTable } from './tables/building_hours';
import type { BuildingImagesTable } from './tables/building_images';
import type { BuildingRoomsTable } from './tables/building_rooms';
import type { BuildingsTable } from './tables/buildings';
import type { CategoriesTable } from './tables/categories';
import type { ClassroomBookingsTable } from './tables/classroom_bookings';
import type { FeedbackTable } from './tables/feedback';
import type { NotesTable } from './tables/notes';
import type { RoomAvailabilityTable } from './tables/room_availability';
import type { RoomCategoriesTable } from './tables/room_categories';
import type { RoomImagesTable } from './tables/room_images';
import type { RoomNotesTable } from './tables/room_notes';
import type { VenueHoursTable } from './tables/venue_hours';
import type { VenueImagesTable } from './tables/venue_images';
import type { VenuesTable } from './tables/venues';

/**
 * Supabase-shaped database type, assembled from one file per table in `./tables`.
 * After a schema change, regenerate with `supabase gen types` and copy the changed
 * table's block into its file.
 */
export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      amenities: AmenitiesTable;
      building_hours: BuildingHoursTable;
      building_images: BuildingImagesTable;
      building_rooms: BuildingRoomsTable;
      buildings: BuildingsTable;
      categories: CategoriesTable;
      classroom_bookings: ClassroomBookingsTable;
      feedback: FeedbackTable;
      notes: NotesTable;
      room_availability: RoomAvailabilityTable;
      room_categories: RoomCategoriesTable;
      room_images: RoomImagesTable;
      room_notes: RoomNotesTable;
      venue_hours: VenueHoursTable;
      venue_images: VenueImagesTable;
      venues: VenuesTable;
    };
    // Compatibility views from the venues expand migration. They are dropped, along
    // with building_rooms.library_id, by supabase/migrations-pending/2026-08-24-venues-contract.sql.
    Views: {
      libraries: {
        Row: {
          building_uuid: string | null;
          id: string | null;
          name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'venues_building_uuid_fkey';
            columns: ['building_uuid'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['uuid'];
          },
        ];
      };
      library_hours: {
        Row: {
          closes_at: string | null;
          day_of_week: number | null;
          id: string | null;
          library_id: string | null;
          opens_at: string | null;
        };
        Relationships: [];
      };
      library_images: {
        Row: {
          id: string | null;
          image_url: string | null;
          library_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])> = (PublicSchema['Tables'] &
  PublicSchema['Views'])[T]['Row'];

export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
