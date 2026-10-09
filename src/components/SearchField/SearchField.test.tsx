import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchField from './SearchField';

const noop = () => {};

describe('SearchField', () => {
  it('is a labelled search box with a hint', () => {
    render(<SearchField value="" onChange={noop} onSubmit={noop} />);
    expect(screen.getByRole('searchbox', { name: 'Search buildings' })).toHaveAttribute(
      'placeholder',
      'Search by building name/code...',
    );
  });

  it('hides the clear button while empty', () => {
    render(<SearchField value="" onChange={noop} onSubmit={noop} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('offers a clear button once there is a query', async () => {
    const onClear = vi.fn();
    render(<SearchField value="ICCS" onChange={noop} onSubmit={noop} onClear={onClear} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
