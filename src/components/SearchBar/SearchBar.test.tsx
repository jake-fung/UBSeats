import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SearchBar from './SearchBar';

const noop = () => {};

describe('SearchBar', () => {
  it('shows the current query in the search box', () => {
    render(<SearchBar searchQuery="Koerner" showSearch collapseNav={false} onInputChange={noop} onSubmit={noop} />);
    expect(screen.getByRole('searchbox', { name: 'Search buildings' })).toHaveValue('Koerner');
  });
});
