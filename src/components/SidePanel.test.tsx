import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { setNow, WED_10AM } from '@/test/clock';
import { makeIcics } from '@/test/fixtures';
import { SidePanel } from './SidePanel';

describe('SidePanel', () => {
  beforeEach(() => {
    setNow(WED_10AM);
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
  });

  it('offers to expand while closed', () => {
    renderWithProviders(<SidePanel building={makeIcics()} isOpen={false} onClose={() => {}} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Expand panel' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('offers to collapse while open, and shows the building', async () => {
    const onToggle = vi.fn();
    const { user } = renderWithProviders(
      <SidePanel building={makeIcics()} isOpen onClose={() => {}} onToggle={onToggle} />,
    );
    await user.click(screen.getByRole('button', { name: 'Collapse panel' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { level: 2, name: 'ICICS' })).toBeInTheDocument();
  });
});
