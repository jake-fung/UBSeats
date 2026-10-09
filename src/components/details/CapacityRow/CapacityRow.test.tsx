import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapacityRow } from './CapacityRow';

describe('CapacityRow', () => {
  it('shows the capacity', () => {
    render(<CapacityRow capacity={12} />);
    expect(screen.getByText('Capacity: 12')).toBeInTheDocument();
  });

  it('renders nothing when capacity is unknown', () => {
    const { container } = render(<CapacityRow capacity={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
