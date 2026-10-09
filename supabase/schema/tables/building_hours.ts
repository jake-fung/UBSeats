export type BuildingHoursTable = {
  Row: {
    building_uuid: string;
    closes_at: string | null;
    day_of_week: number;
    id: string;
    opens_at: string | null;
  };
  Insert: {
    building_uuid: string;
    closes_at?: string | null;
    day_of_week: number;
    id?: string;
    opens_at?: string | null;
  };
  Update: {
    building_uuid?: string;
    closes_at?: string | null;
    day_of_week?: number;
    id?: string;
    opens_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: 'building_hours_building_uuid_fkey';
      columns: ['building_uuid'];
      isOneToOne: false;
      referencedRelation: 'buildings';
      referencedColumns: ['uuid'];
    },
  ];
};

export interface DayHours {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
}
