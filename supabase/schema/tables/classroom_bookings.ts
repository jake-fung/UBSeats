export type ClassroomBookingsTable = {
  Row: {
    ends_at: string;
    id: string;
    room_uuid: string;
    scraped_at: string;
    starts_at: string;
    title: string | null;
  };
  Insert: {
    ends_at: string;
    id?: string;
    room_uuid: string;
    scraped_at?: string;
    starts_at: string;
    title?: string | null;
  };
  Update: {
    ends_at?: string;
    id?: string;
    room_uuid?: string;
    scraped_at?: string;
    starts_at?: string;
    title?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: 'classroom_bookings_room_uuid_fkey';
      columns: ['room_uuid'];
      isOneToOne: false;
      referencedRelation: 'building_rooms';
      referencedColumns: ['uuid'];
    },
  ];
};
