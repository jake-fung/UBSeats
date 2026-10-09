import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { setNow, WED_10AM } from '@/test/clock';
import { makeRoom, makeVenue, weekdayHours } from '@/test/fixtures';
import { VenueCard } from './VenueCard';

const ROOM_A = makeRoom({ uuid: 'a', name: 'Room A' });
const ROOM_B = makeRoom({ uuid: 'b', name: 'Room B' });

describe('VenueCard', () => {
  beforeEach(() => {
    setNow(WED_10AM);
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
  });

  it('groups several spaces behind a collapsed toggle', async () => {
    const { user } = renderWithProviders(<VenueCard venue={makeVenue({ rooms: [ROOM_A, ROOM_B] })} />);
    const toggle = screen.getByRole('button', { name: 'Alpha Library (2 Spaces)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'Room A' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Room B' })).toBeInTheDocument();
  });

  it('opens a filtered venue and counts one space in the singular', () => {
    renderWithProviders(<VenueCard venue={makeVenue({ rooms: [ROOM_A], totalRooms: 2 })} />);
    expect(screen.getByRole('button', { name: 'Alpha Library (1 Space)' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows a single-space venue flat, titled with the venue name', () => {
    renderWithProviders(<VenueCard venue={makeVenue({ rooms: [ROOM_A] })} />);
    expect(screen.queryByRole('button', { name: /Space/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alpha Library' })).toBeInTheDocument();
  });

  it('shows the venue’s own hours', () => {
    renderWithProviders(
      <VenueCard venue={makeVenue({ rooms: [ROOM_A, ROOM_B], hours: weekdayHours(3, '09:00', '17:00') })} />,
    );
    expect(screen.getByRole('button', { name: 'Open · 9am – 5pm' })).toBeInTheDocument();
  });

  it('describes the venue photo', () => {
    renderWithProviders(<VenueCard venue={makeVenue({ rooms: [ROOM_A, ROOM_B], image: 'https://x/alpha.jpg' })} />);
    expect(screen.getByRole('img', { name: 'Alpha Library' })).toBeInTheDocument();
  });

  it('renders nothing without rooms', () => {
    const { container } = renderWithProviders(<VenueCard venue={makeVenue({ rooms: [] })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
