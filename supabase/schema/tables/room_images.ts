export type RoomImagesTable = {
  Row: {
    id: string;
    image_url: string;
    room_uuid: string;
  };
  Insert: {
    id?: string;
    image_url: string;
    room_uuid: string;
  };
  Update: {
    id?: string;
    image_url?: string;
    room_uuid?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'cafe_images_room_uuid_fkey';
      columns: ['room_uuid'];
      isOneToOne: false;
      referencedRelation: 'building_rooms';
      referencedColumns: ['uuid'];
    },
  ];
};
