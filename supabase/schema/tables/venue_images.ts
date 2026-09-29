export type VenueImagesTable = {
  Row: {
    id: string;
    image_url: string;
    venue_id: string;
  };
  Insert: {
    id?: string;
    image_url: string;
    venue_id: string;
  };
  Update: {
    id?: string;
    image_url?: string;
    venue_id?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'venue_images_venue_id_fkey';
      columns: ['venue_id'];
      isOneToOne: false;
      referencedRelation: 'venues';
      referencedColumns: ['id'];
    },
  ];
};
