import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryTags } from './CategoryTags';

describe('CategoryTags', () => {
  it('labels every room category', () => {
    render(<CategoryTags categoryIds={['quiet', 'bookable', 'classroom', 'cafe', 'workstation']} />);
    for (const label of ['Quiet', 'Bookable', 'Classroom', 'Café', 'Workstations']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('skips categories without a tag', () => {
    const { container } = render(<CategoryTags categoryIds={['library']} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without categories', () => {
    const { container } = render(<CategoryTags categoryIds={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
