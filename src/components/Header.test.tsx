import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('shows the app name', () => {
    render(<Header searchQuery="" />);
    expect(screen.getByRole('heading', { name: 'UBSeats' })).toBeInTheDocument();
  });

  it('shows the search box on desktop', () => {
    render(<Header searchQuery="" isMobile={false} />);
    expect(screen.getByRole('searchbox', { name: 'Search buildings' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('shows a collapsed search button on mobile', () => {
    // Index.tsx always passes showSearch as a boolean.
    render(<Header searchQuery="" isMobile showSearch={false} />);
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the mobile search button expanded while search is open', () => {
    render(<Header searchQuery="" isMobile showSearch />);
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('drops the search box when the desktop panel shifts the header', () => {
    render(<Header searchQuery="" isMobile={false} desktopShift />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
