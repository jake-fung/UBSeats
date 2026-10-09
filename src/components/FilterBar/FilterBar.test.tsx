import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { FRI_KEY, setNow, WED_10AM } from '@/test/clock';
import FilterBar from './FilterBar';

const LIBRARY = { id: 'library' as const, name: 'Library', icon: 'Book', color: '#000' };

describe('FilterBar', () => {
  beforeEach(() => setNow(WED_10AM));

  it('shows the live filters and the stored categories today', async () => {
    vi.mocked(service.fetchCategories).mockResolvedValue([LIBRARY]);
    renderWithProviders(<FilterBar onFilterChange={() => {}} activeFilters={{}} />);
    for (const name of ['Now Available Rooms', 'Open Buildings', 'Library']) {
      expect(await screen.findByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('hides the right-now filters for another day', async () => {
    vi.mocked(service.fetchCategories).mockResolvedValue([LIBRARY]);
    renderWithProviders(<FilterBar onFilterChange={() => {}} activeFilters={{}} />, { selectedKey: FRI_KEY });
    expect(await screen.findByRole('button', { name: 'Library' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Now Available Rooms' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Buildings' })).not.toBeInTheDocument();
  });

  it('selects a category', async () => {
    vi.mocked(service.fetchCategories).mockResolvedValue([LIBRARY]);
    const onFilterChange = vi.fn();
    const { user } = renderWithProviders(<FilterBar onFilterChange={onFilterChange} activeFilters={{}} />);
    await user.click(await screen.findByRole('button', { name: 'Library' }));
    expect(onFilterChange).toHaveBeenCalledWith({ category: 'library' });
  });

  it('marks the active category as pressed', async () => {
    vi.mocked(service.fetchCategories).mockResolvedValue([LIBRARY]);
    renderWithProviders(<FilterBar onFilterChange={() => {}} activeFilters={{ category: 'library' }} />);
    expect(await screen.findByRole('button', { name: 'Library' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows no category names while loading', () => {
    vi.mocked(service.fetchCategories).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<FilterBar onFilterChange={() => {}} activeFilters={{}} />);
    expect(screen.queryByRole('button', { name: 'Library' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Buildings' })).not.toBeInTheDocument();
  });
});
