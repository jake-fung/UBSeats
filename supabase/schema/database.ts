import type { AmenitiesTable } from './tables/amenities';
import type { BuildingHoursTable } from './tables/building_hours';
import type { BuildingHoursByWeekTable } from './tables/building_hours_by_week';
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
import type { VenueHoursByWeekTable } from './tables/venue_hours_by_week';
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
      building_hours_by_week: BuildingHoursByWeekTable;
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
      venue_hours_by_week: VenueHoursByWeekTable;
      venue_images: VenueImagesTable;
      venues: VenuesTable;
    };
    Views: {
      [_ in never]: never;
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
