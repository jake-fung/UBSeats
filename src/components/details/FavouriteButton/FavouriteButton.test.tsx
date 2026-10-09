import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavouriteButton } from './FavouriteButton';

// favouritesStore keeps its set for the whole file, so every test uses its own room uuid.
describe('FavouriteButton', () => {
  it('offers to add a room to favourites', () => {
    render(<FavouriteButton roomUuid="fav-1" roomName="Lab A" />);
    expect(screen.getByRole('button', { name: 'Add Lab A to favourites' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('saves the room and offers to remove it', async () => {
    render(<FavouriteButton roomUuid="fav-2" roomName="Lab B" />);
    await userEvent.click(screen.getByRole('button', { name: 'Add Lab B to favourites' }));

    expect(screen.getByRole('button', { name: 'Remove Lab B from favourites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(JSON.parse(localStorage.getItem('ubseats:favourites') ?? '[]')).toContain('fav-2');
  });
});
