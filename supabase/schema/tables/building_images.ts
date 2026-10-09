export type BuildingImagesTable = {
  Row: {
    building_uuid: string;
    id: string;
    image_url: string | null;
  };
  Insert: {
    building_uuid?: string;
    id?: string;
    image_url?: string | null;
  };
  Update: {
    building_uuid?: string;
    id?: string;
    image_url?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: 'building_images_building_uuid_fkey';
      columns: ['building_uuid'];
      isOneToOne: false;
      referencedRelation: 'buildings';
      referencedColumns: ['uuid'];
    },
  ];
};
