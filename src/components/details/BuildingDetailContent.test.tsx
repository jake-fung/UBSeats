import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { FRI_KEY, setNow, WED_10AM } from '@/test/clock';
import { makeIcics } from '@/test/fixtures';
import { BuildingDetailContent } from './BuildingDetailContent';

describe('BuildingDetailContent', () => {
  beforeEach(() => {
    setNow(WED_10AM);
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
  });

  it('shows the building’s code, name, address, hours, photo and spaces', () => {
    renderWithProviders(<BuildingDetailContent building={makeIcics()} isOpen onClose={() => {}} variant="panel" />);
    expect(screen.getByText('ICCS')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'ICICS' })).toBeInTheDocument();
    expect(screen.getByText('2366 Main Mall')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open · 9am – 5pm' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ICICS' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spaces (1)' })).toBeInTheDocument();
  });

  it('names the picked day when it isn’t today', () => {
    renderWithProviders(<BuildingDetailContent building={makeIcics()} isOpen onClose={() => {}} variant="panel" />, {
      selectedKey: FRI_KEY,
    });
    expect(screen.getByText('Showing Fri, Oct 9 opening hours & timetable')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <BuildingDetailContent building={makeIcics()} isOpen onClose={onClose} variant="panel" />,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows no spaces without a building', () => {
    renderWithProviders(<BuildingDetailContent isOpen={false} onClose={() => {}} variant="panel" />);
    expect(screen.queryByRole('heading', { name: /^Spaces/ })).not.toBeInTheDocument();
  });
});
