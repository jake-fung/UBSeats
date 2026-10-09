import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { setNow, WED_10AM } from '@/test/clock';
import { makeIcics } from '@/test/fixtures';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('shows the building while open', () => {
    setNow(WED_10AM);
    vi.mocked(service.fetchRoomAvailability).mockResolvedValue(new Map());
    renderWithProviders(<BottomSheet building={makeIcics()} isOpen onClose={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'ICICS' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spaces (1)' })).toBeInTheDocument();
  });
});
