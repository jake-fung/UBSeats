import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { setNow, WED_10AM } from '@/test/clock';
import { TimeSlot } from '@/utils/hoursUtils';
import { RoomTimetable } from './RoomTimetable';

const FRIDAY = new Date('2026-10-09T00:00:00');
const WEDNESDAY = new Date('2026-10-07T00:00:00');
const at = (local: string) => new Date(local).toISOString();

const SLOTS: TimeSlot[] = [
  { start: at('2026-10-09T09:00:00'), end: at('2026-10-09T11:00:00'), available: true },
  { start: at('2026-10-09T11:00:00'), end: at('2026-10-09T12:30:00'), available: false, title: 'CPSC 110' },
];

// One 15-minute block per index: 09:00 is block 36, 11:00 is block 44.
const block = (container: HTMLElement, index: number) =>
  container.querySelectorAll<HTMLElement>('[data-timetable-block]')[index];

describe('RoomTimetable', () => {
  beforeEach(() => setNow(WED_10AM));

  it('summarises the day for screen readers', () => {
    renderWithProviders(<RoomTimetable slots={SLOTS} date={FRIDAY} />);
    expect(screen.getByText('Available 9am–11am; Booked 11am–12:30pm')).toBeInTheDocument();
  });

  it('labels the hours under the strip', () => {
    renderWithProviders(<RoomTimetable slots={SLOTS} date={FRIDAY} />);
    for (const hour of ['9am', '10am', '11am', '12pm']) {
      expect(screen.getByText(hour)).toBeInTheDocument();
    }
  });

  it('shows the time and status of an available block on hover', async () => {
    const { container, user } = renderWithProviders(<RoomTimetable slots={SLOTS} date={FRIDAY} />);
    await user.hover(block(container, 36));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('9am–9:15am · Available');
  });

  it('names the booking on a booked block', async () => {
    const { container, user } = renderWithProviders(<RoomTimetable slots={SLOTS} date={FRIDAY} />);
    await user.hover(block(container, 44));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('11am–11:15am · Unavailable');
    expect(tooltip).toHaveTextContent('CPSC 110');
  });

  it('says closed all day for another day with no open time', () => {
    renderWithProviders(<RoomTimetable slots={[]} date={FRIDAY} />);
    expect(screen.getByText('Closed all day')).toBeInTheDocument();
  });

  it('renders nothing today when no open time is left', () => {
    const { container } = renderWithProviders(<RoomTimetable slots={[]} date={WEDNESDAY} />);
    expect(container).toBeEmptyDOMElement();
  });
});
