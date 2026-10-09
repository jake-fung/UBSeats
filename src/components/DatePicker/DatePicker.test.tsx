import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { setNow, WED_10AM } from '@/test/clock';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
  beforeEach(() => setNow(WED_10AM));

  it('offers to pick a day', () => {
    renderWithProviders(<DatePicker />);
    expect(screen.getByRole('button', { name: 'Pick a day' })).toBeInTheDocument();
  });

  it('shows two weeks from this Monday, with past days disabled', async () => {
    const { user } = renderWithProviders(<DatePicker />);
    await user.click(screen.getByRole('button', { name: 'Pick a day' }));
    const picker = await screen.findByRole('dialog');

    for (const weekday of ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']) {
      expect(within(picker).getByText(weekday)).toBeInTheDocument();
    }
    expect(within(picker).getAllByRole('button')).toHaveLength(14);
    expect(within(picker).getByRole('button', { name: 'Wednesday, October 7' })).toHaveAttribute(
      'aria-current',
      'date',
    );
    expect(within(picker).getByRole('button', { name: 'Monday, October 5' })).toBeDisabled();
    expect(within(picker).getByRole('button', { name: 'Tuesday, October 6' })).toBeDisabled();
  });

  it('names the picked day and can go back to today', async () => {
    const { user } = renderWithProviders(<DatePicker />);
    await user.click(screen.getByRole('button', { name: 'Pick a day' }));
    await user.click(await screen.findByRole('button', { name: 'Friday, October 9' }));

    const trigger = screen.getByRole('button', { name: 'Showing Friday, October 9. Pick a day' });
    expect(trigger).toHaveTextContent('Fri, Oct 9');

    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Back to today' }));
    expect(screen.getByRole('button', { name: 'Pick a day' })).toBeInTheDocument();
  });
});
