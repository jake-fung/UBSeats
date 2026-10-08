import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { FRI_KEY, setNow, SUN_NOON, WED_10AM, WED_8PM } from '@/test/clock';
import { weekdayHours } from '@/test/fixtures';
import { getBuildingStatus, hoursForDate, HoursOwner } from '@/utils/hoursUtils';
import { HoursPill } from './HoursPill';

const WEDNESDAY_9_TO_5: HoursOwner = { hours: weekdayHours(3, '09:00', '17:00'), hoursByWeek: new Map() };

/** Renders the pill the way the app does: status computed from the owner's hours at the faked "now". */
function renderPill(owner: HoursOwner, selectedKey: string | null = null) {
  const status = getBuildingStatus(hoursForDate(owner, new Date()) ?? []);
  return renderWithProviders(<HoursPill status={status} owner={owner} />, { selectedKey });
}

describe('HoursPill', () => {
  it('says open with today’s hours while open', () => {
    setNow(WED_10AM);
    renderPill(WEDNESDAY_9_TO_5);
    expect(screen.getByRole('button', { name: 'Open · 9am – 5pm' })).toBeInTheDocument();
  });

  it('says closed with today’s hours after closing', () => {
    setNow(WED_8PM);
    renderPill(WEDNESDAY_9_TO_5);
    expect(screen.getByRole('button', { name: 'Closed · 9am – 5pm' })).toBeInTheDocument();
  });

  it('says just closed on a day with no hours', () => {
    setNow(SUN_NOON);
    renderPill(WEDNESDAY_9_TO_5);
    expect(screen.getByRole('button', { name: 'Closed' })).toBeInTheDocument();
  });

  it('says hours are not published when the synced week is missing', () => {
    setNow(WED_10AM);
    renderPill({ hours: [], hoursByWeek: new Map([['2026-09-27', weekdayHours(3, '09:00', '17:00')]]) });
    expect(screen.getByRole('button', { name: 'Hours not published yet' })).toBeInTheDocument();
  });

  it('expands to the full week', async () => {
    setNow(WED_10AM);
    const { user } = renderPill(WEDNESDAY_9_TO_5);
    const button = screen.getByRole('button', { name: 'Open · 9am – 5pm' });
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    const list = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(list).toHaveAttribute('aria-hidden', 'false');
    for (const day of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
      const row = within(list).getByText(day).parentElement!;
      expect(row).toHaveTextContent(day === 'Wednesday' ? 'Wednesday9am – 5pm' : `${day}Closed`);
    }
  });

  it('drops the open/closed prefix for another picked day', () => {
    setNow(WED_10AM);
    renderPill(WEDNESDAY_9_TO_5, FRI_KEY);
    expect(screen.getByRole('button', { name: 'Closed' })).toBeInTheDocument();
  });
});
