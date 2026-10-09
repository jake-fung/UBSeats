import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Note } from '@/supabase/schema';
import { NoteTags } from './NoteTags';

const NOTE: Note = { id: 'n1', name: 'Mac lab', color: null, description: 'Has 20 iMacs', icon: 'Apple' };

describe('NoteTags', () => {
  it('names each note on its button and tooltip', async () => {
    const { user } = renderWithProviders(<NoteTags notes={[NOTE]} />);
    await user.hover(screen.getByRole('button', { name: 'Mac lab' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Mac lab');
  });

  it('opens the note explainer on click', async () => {
    const { user } = renderWithProviders(<NoteTags notes={[NOTE]} />);
    await user.click(screen.getByRole('button', { name: 'Mac lab' }));
    const dialog = await screen.findByRole('dialog', { name: 'Mac lab' });
    expect(within(dialog).getByText('Has 20 iMacs')).toBeInTheDocument();
  });

  it('renders nothing without notes', () => {
    const { container } = renderWithProviders(<NoteTags notes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
