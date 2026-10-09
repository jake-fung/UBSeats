import type { Note } from './notes';

export type BuildingRoomsTable = {
  Row: {
    building_uuid: string;
    capacity: number | null;
    venue_id: string | null;
    link: string | null;
    room_name: string | null;
    source_key: string | null;
    uuid: string;
  };
  Insert: {
    building_uuid?: string;
    capacity?: number | null;
    venue_id?: string | null;
    link?: string | null;
    room_name?: string | null;
    source_key?: string | null;
    uuid?: string;
  };
  Update: {
    building_uuid?: string;
    capacity?: number | null;
    venue_id?: string | null;
    link?: string | null;
    room_name?: string | null;
    source_key?: string | null;
    uuid?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'building_rooms_building_uuid_fkey';
      columns: ['building_uuid'];
      isOneToOne: false;
      referencedRelation: 'buildings';
      referencedColumns: ['uuid'];
    },
    {
      foreignKeyName: 'building_rooms_venue_id_fkey';
      columns: ['venue_id'];
      isOneToOne: false;
      referencedRelation: 'venues';
      referencedColumns: ['id'];
    },
  ];
};

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
