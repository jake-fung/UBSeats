import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { FRI_KEY, setNow, WED_10AM } from '@/test/clock';
import { SelectedDayHint } from './SelectedDayHint';

describe('SelectedDayHint', () => {
  beforeEach(() => setNow(WED_10AM));

  it('stays hidden for today', () => {
    const { container } = renderWithProviders(<SelectedDayHint />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names the picked day', () => {
    renderWithProviders(<SelectedDayHint />, { selectedKey: FRI_KEY });
    expect(screen.getByText('Showing Fri, Oct 9 opening hours & timetable')).toBeInTheDocument();
  });
});
