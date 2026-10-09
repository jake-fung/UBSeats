import type { DayHours } from './building_hours';
import type { Room } from './building_rooms';
import type { Venue } from './venues';

export type BuildingsTable = {
  Row: {
    bldg_code: string;
    bldg_usage: string | null;
    hours_synced_at: string | null;
    lat: number;
    library_branch: string | null;
    lng: number;
    name: string;
    primary_address: string | null;
    uuid: string;
  };
  Insert: {
    bldg_code: string;
    bldg_usage?: string | null;
    hours_synced_at?: string | null;
    lat: number;
    library_branch?: string | null;
    lng: number;
    name: string;
    primary_address?: string | null;
    uuid?: string;
  };
  Update: {
    bldg_code?: string;
    bldg_usage?: string | null;
    hours_synced_at?: string | null;
    lat?: number;
    library_branch?: string | null;
    lng?: number;
    name?: string;
    primary_address?: string | null;
    uuid?: string;
  };
  Relationships: [];
};

export interface Building {
  uuid: string;
  name: string;
  code: string;
  primaryAddress: string;
  lat: number;
  lng: number;
  image: string | undefined;
  rooms: Room[];
  /** Hand-entered hours that repeat every week. Read through hoursForDate. */
  hours: DayHours[];
  /** Synced actual hours keyed by week start ("YYYY-MM-DD", a Sunday). Empty if not synced. */
  hoursByWeek: Map<string, DayHours[]>;
  venues: Venue[];
}
