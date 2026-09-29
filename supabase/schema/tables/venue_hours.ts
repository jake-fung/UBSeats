export type VenueHoursTable = {
  Row: {
    closes_at: string | null;
    day_of_week: number;
    id: string;
    venue_id: string;
    opens_at: string | null;
  };
  Insert: {
    closes_at?: string | null;
    day_of_week: number;
    id?: string;
    venue_id: string;
    opens_at?: string | null;
  };
  Update: {
    closes_at?: string | null;
    day_of_week?: number;
    id?: string;
    venue_id?: string;
    opens_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: 'venue_hours_venue_id_fkey';
      columns: ['venue_id'];
      isOneToOne: false;
      referencedRelation: 'venues';
      referencedColumns: ['id'];
    },
  ];
};
