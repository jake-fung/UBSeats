export type RoomCategoriesTable = {
  Row: {
    categories_id: string | null;
    id: string;
    room_uuid: string;
  };
  Insert: {
    categories_id?: string | null;
    id?: string;
    room_uuid?: string;
  };
  Update: {
    categories_id?: string | null;
    id?: string;
    room_uuid?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'room_amenities_room_uuid_fkey';
      columns: ['room_uuid'];
      isOneToOne: false;
      referencedRelation: 'building_rooms';
      referencedColumns: ['uuid'];
    },
    {
      foreignKeyName: 'room_categories_categories_id_fkey';
      columns: ['categories_id'];
      isOneToOne: false;
      referencedRelation: 'categories';
      referencedColumns: ['id'];
    },
  ];
};
