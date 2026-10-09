import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocateButton from './LocateButton';

describe('LocateButton', () => {
  it('is off by default', () => {
    render(<LocateButton enabled={false} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Show my location' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows as pressed when location is on', () => {
    render(<LocateButton enabled onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Show my location' })).toHaveAttribute('aria-pressed', 'true');
  });
});
