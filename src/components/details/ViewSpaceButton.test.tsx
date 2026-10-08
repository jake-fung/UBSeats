import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewSpaceButton } from './ViewSpaceButton';

const LINK = 'https://libcal.library.ubc.ca/space/1';
// The sr-only hint is an inline sibling, so the computed name has no space before "(".

describe('ViewSpaceButton', () => {
  it('says Reserve for a bookable space', () => {
    render(<ViewSpaceButton link={LINK} bookable />);
    expect(screen.getByRole('link', { name: 'Reserve(opens in new tab)' })).toHaveAttribute('href', LINK);
  });

  it('says View for a non-bookable space', () => {
    render(<ViewSpaceButton link={LINK} />);
    expect(screen.getByRole('link', { name: 'View(opens in new tab)' })).toHaveAttribute('href', LINK);
  });

  it('renders nothing without a link', () => {
    const { container } = render(<ViewSpaceButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
