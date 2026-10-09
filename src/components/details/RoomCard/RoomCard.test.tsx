import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { makeRoom } from '@/test/fixtures';
import { RoomCard } from './RoomCard';

describe('RoomCard', () => {
  it('shows the room inside a card', () => {
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
    renderWithProviders(<RoomCard room={makeRoom({ name: 'Room 101' })} />);
    expect(screen.getByRole('heading', { name: 'Room 101' })).toBeInTheDocument();
  });
});
