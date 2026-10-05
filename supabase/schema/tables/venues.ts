import type { DayHours } from './building_hours';
import type { Room } from './building_rooms';

export type VenuesTable = {
  Row: {
    building_uuid: string;
    hours_synced_at: string | null;
    id: string;
    kind: string;
    library_branch: string | null;
    name: string;
  };
  Insert: {
    building_uuid: string;
    hours_synced_at?: string | null;
    id?: string;
    kind: string;
    library_branch?: string | null;
    name: string;
  };
  Update: {
    building_uuid?: string;
    hours_synced_at?: string | null;
    id?: string;
    kind?: string;
    library_branch?: string | null;
    name?: string;
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

export type VenueKind = 'library' | 'cafe';

/** A named place inside a building with its own hours and photo: a library or a café. */
export interface Venue {
  id: string;
  buildingUuid: string;
  name: string;
  kind: VenueKind;
  hours: DayHours[];
  rooms: Room[];
  image: string | undefined;
  totalRooms?: number;
}
