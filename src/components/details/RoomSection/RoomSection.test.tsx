import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { makeRoom, makeVenue } from '@/test/fixtures';
import { RoomSection } from './RoomSection';

const ZETA = makeRoom({ uuid: 'zeta', name: 'Zeta Room' });
const ALPHA = makeVenue({
  name: 'Alpha Library',
  rooms: [makeRoom({ uuid: 'a', name: 'Room A' }), makeRoom({ uuid: 'b', name: 'Room B' })],
});

describe('RoomSection', () => {
  beforeEach(() => {
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
  });

  it('counts every space, venue rooms included', () => {
    renderWithProviders(<RoomSection heading="Spaces" rooms={[ZETA]} venues={[ALPHA]} />);
    expect(screen.getByRole('heading', { name: 'Spaces (3)' })).toBeInTheDocument();
  });

  it('lists venues and rooms alphabetically', () => {
    renderWithProviders(<RoomSection heading="Spaces" rooms={[ZETA]} venues={[ALPHA]} />);
    const names = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(names[0]).toBe('Alpha Library (2 Spaces)');
    expect(names.at(-1)).toBe('Zeta Room');
  });

  it('renders nothing without spaces', () => {
    const { container } = renderWithProviders(<RoomSection heading="Spaces" rooms={[]} venues={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
