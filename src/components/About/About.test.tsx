import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { setNow, WED_10AM } from '@/test/clock';
import { RoomAvailability } from '@/supabase/schema';
import About from './About';

const scrapedAt = (at: string | null): RoomAvailability => ({
  isAvailableNow: false,
  availableUntil: null,
  nextAvailableAt: null,
  checkedAt: null,
  scrapedAt: at,
  slots: [],
});

async function openAbout(availability: Map<string, RoomAvailability>) {
  vi.mocked(service.fetchRoomAvailability).mockResolvedValue(availability);
  const { user } = renderWithProviders(<About />);
  await waitFor(() => expect(service.fetchRoomAvailability).toHaveBeenCalled());
  await user.click(screen.getByRole('button', { name: 'About UBSeats' }));
  return screen.findByRole('dialog', { name: 'About UBSeats' });
}

describe('About', () => {
  beforeEach(() => setNow(WED_10AM));

  it('offers About and Feedback buttons', () => {
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
    renderWithProviders(<About />);
    expect(screen.getByRole('button', { name: 'About UBSeats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
  });

  it('describes the app, its stack and its author', async () => {
    const dialog = within(await openAbout(new Map()));
    expect(dialog.getByText(/^UBSeats helps you find an open seat/)).toBeInTheDocument();
    expect(dialog.getByText('Built with')).toBeInTheDocument();
    for (const tech of ['React', 'TypeScript', 'Mapbox GL JS', 'Supabase', 'TanStack Query', 'Tailwind CSS']) {
      expect(dialog.getByText(tech)).toBeInTheDocument();
    }
    expect(dialog.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/jake-fung/UBSeats',
    );
    expect(dialog.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/funghokyeung/',
    );
    expect(dialog.getByText('Built by Jake Fung')).toBeInTheDocument();
    expect(dialog.getByText('© 2026 UBSeats. All rights reserved.')).toBeInTheDocument();
  });

  it('says when classroom availability was last updated, in Vancouver time', async () => {
    const dialog = within(await openAbout(new Map([['room-1', scrapedAt('2026-10-07T15:41:00-07:00')]])));
    expect(await dialog.findByText('Classroom availability last updated: Oct 7, 3:41 PM PDT')).toBeInTheDocument();
  });

  it('leaves out the update line when nothing was scraped', async () => {
    const dialog = within(await openAbout(new Map([['room-1', scrapedAt(null)]])));
    expect(dialog.queryByText(/last updated/)).not.toBeInTheDocument();
  });
});
