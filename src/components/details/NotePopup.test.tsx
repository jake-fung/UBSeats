import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { Note } from '@/supabase/schema';
import { NotePopup } from './NotePopup';

const NOTE: Note = { id: 'n1', name: 'Mac lab', color: null, description: 'Has 20 iMacs', icon: 'Apple' };
const noFocus = { current: null };

describe('NotePopup', () => {
  it('stays closed without a note', () => {
    renderWithProviders(<NotePopup note={null} onClose={() => {}} returnFocusRef={noFocus} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('explains the note and how to close it', () => {
    renderWithProviders(<NotePopup note={NOTE} onClose={() => {}} returnFocusRef={noFocus} />);
    const dialog = screen.getByRole('dialog', { name: 'Mac lab' });
    expect(within(dialog).getByText('Has 20 iMacs')).toBeInTheDocument();
    expect(within(dialog).getByText('Tap anywhere or press Esc to close')).toBeInTheDocument();
  });
});
