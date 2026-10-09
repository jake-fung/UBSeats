export type BuildingHoursByWeekTable = {
  Row: {
    building_uuid: string;
    closes_at: string;
    day_of_week: number;
    id: string;
    opens_at: string;
    week_start: string;
  };
  Insert: {
    building_uuid: string;
    closes_at: string;
    day_of_week: number;
    id?: string;
    opens_at: string;
    week_start: string;
  };
  Update: {
    building_uuid?: string;
    closes_at?: string;
    day_of_week?: number;
    id?: string;
    opens_at?: string;
    week_start?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'building_hours_by_week_building_uuid_fkey';
      columns: ['building_uuid'];
      isOneToOne: false;
      referencedRelation: 'buildings';
      referencedColumns: ['uuid'];
    },
  ];
};
