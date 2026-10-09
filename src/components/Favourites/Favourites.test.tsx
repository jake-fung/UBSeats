import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Favourites from './Favourites';

describe('Favourites', () => {
  it('turns the favourites filter on', async () => {
    const onFilterChange = vi.fn();
    render(<Favourites onFilterChange={onFilterChange} activeFilters={{}} />);
    const button = screen.getByRole('button', { name: 'Favourites only' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    expect(onFilterChange).toHaveBeenCalledWith({ category: 'favourites' });
  });

  it('turns the favourites filter off when active', async () => {
    const onFilterChange = vi.fn();
    render(<Favourites onFilterChange={onFilterChange} activeFilters={{ category: 'favourites' }} />);
    const button = screen.getByRole('button', { name: 'Favourites only' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(onFilterChange).toHaveBeenCalledWith({ category: undefined });
  });
});
