import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { setNow, WED_10AM } from '@/test/clock';
import { makeRoom, makeVenue } from '@/test/fixtures';
import { RoomAvailability } from '@/supabase/schema';
import { RoomDetails } from './RoomDetails';

const ROOM = makeRoom({
  uuid: 'room-1',
  name: 'Room 101',
  capacity: 8,
  link: 'https://libcal.library.ubc.ca/space/101',
  categoryIds: ['bookable'],
  notes: [{ id: 'n1', name: 'Mac lab', color: null, description: 'Has 20 iMacs', icon: 'Apple' }],
});

const OPEN_9_TO_5: RoomAvailability = {
  isAvailableNow: true,
  availableUntil: null,
  nextAvailableAt: null,
  checkedAt: null,
  scrapedAt: null,
  slots: [
    {
      start: new Date('2026-10-07T09:00:00').toISOString(),
      end: new Date('2026-10-07T17:00:00').toISOString(),
      available: true,
    },
  ],
};

describe('RoomDetails', () => {
  beforeEach(() => setNow(WED_10AM));

  it('shows the room’s details and today’s remaining availability', async () => {
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map([['room-1', OPEN_9_TO_5]]));
    renderWithProviders(<RoomDetails room={ROOM} />);

    expect(screen.getByRole('heading', { name: 'Room 101' })).toBeInTheDocument();
    expect(screen.getByText('Capacity: 8')).toBeInTheDocument();
    expect(screen.getByText('Bookable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reserve(opens in new tab)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Room 101 to favourites' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mac lab' })).toBeInTheDocument();
    // Today hides blocks that have ended, so the summary starts at the current block.
    expect(await screen.findByText('Available 10am–5pm')).toBeInTheDocument();
  });

  it('uses the venue name as the title inside a venue', () => {
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
    renderWithProviders(<RoomDetails room={ROOM} venue={makeVenue({ name: 'Koerner Library' })} />);
    expect(screen.getByRole('heading', { name: 'Koerner Library' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Koerner Library to favourites' })).toBeInTheDocument();
  });

  it('shows no timetable without availability data', async () => {
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
    renderWithProviders(<RoomDetails room={ROOM} />);
    await waitFor(() => expect(service.fetchRoomAvailability).toHaveBeenCalled());
    expect(screen.queryByText(/^Available /)).not.toBeInTheDocument();
  });
});
