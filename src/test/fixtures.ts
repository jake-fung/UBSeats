import { Building, DayHours, Room, Venue } from '@/supabase/schema';

export function weekdayHours(dayOfWeek: number, opensAt: string, closesAt: string): DayHours[] {
  return [{ dayOfWeek, opensAt, closesAt }];
}

export function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    uuid: 'room-1',
    building_uuid: 'bldg-1',
    name: 'Room 101',
    capacity: null,
    link: '',
    categoryIds: [],
    notes: [],
    ...overrides,
  };
}

export function makeVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: 'venue-1',
    buildingUuid: 'bldg-1',
    name: 'Alpha Library',
    kind: 'library',
    hours: [],
    hoursByWeek: new Map(),
    rooms: [],
    image: undefined,
    ...overrides,
  };
}

export function makeBuilding(overrides: Partial<Building> = {}): Building {
  return {
    uuid: 'bldg-1',
    name: 'ICICS',
    code: 'ICCS',
    primaryAddress: '2366 Main Mall',
    lat: 49.26,
    lng: -123.25,
    image: undefined,
    rooms: [],
    hours: [],
    hoursByWeek: new Map(),
    venues: [],
    ...overrides,
  };
}
