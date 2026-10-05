export type VenueHoursByWeekTable = {
  Row: {
    closes_at: string;
    day_of_week: number;
    id: string;
    opens_at: string;
    venue_id: string;
    week_start: string;
  };
  Insert: {
    closes_at: string;
    day_of_week: number;
    id?: string;
    opens_at: string;
    venue_id: string;
    week_start: string;
  };
  Update: {
    closes_at?: string;
    day_of_week?: number;
    id?: string;
    opens_at?: string;
    venue_id?: string;
    week_start?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'venue_hours_by_week_venue_id_fkey';
      columns: ['venue_id'];
      isOneToOne: false;
      referencedRelation: 'venues';
      referencedColumns: ['id'];
    },
  ];
};
