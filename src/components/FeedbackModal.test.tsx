import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import * as service from '@/supabase/services/supabaseService';
import { renderWithProviders } from '@/test/render';
import { Dialog } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/toaster';
import FeedbackModal from './FeedbackModal';

function renderModal(onClose = vi.fn()) {
  const result = renderWithProviders(
    <>
      <Dialog open>
        <FeedbackModal onClose={onClose} />
      </Dialog>
      <Toaster />
    </>,
  );
  return { ...result, onClose };
}

/** Picks a category and a device and types a padded message, which is enough to enable Send. */
async function fillIn(user: ReturnType<typeof renderModal>['user']) {
  await user.click(screen.getByRole('button', { name: 'Report a bug' }));
  await user.click(screen.getByRole('button', { name: 'Laptop or desktop' }));
  await user.type(screen.getByRole('textbox', { name: 'Feedback message' }), '  Map is slow  ');
}

describe('FeedbackModal', () => {
  it('asks what the feedback is about and which device it’s from', () => {
    renderModal();
    const dialog = within(screen.getByRole('dialog', { name: 'Feedback' }));
    expect(dialog.getByText('Please provide feedback on how I can improve UBSeats.')).toBeInTheDocument();

    const suggestion = within(dialog.getByRole('group', { name: 'what is your suggestion?' }));
    for (const name of ['Report a bug', 'Request a new feature', 'Suggest a new study spot', 'Other']) {
      expect(suggestion.getByRole('button', { name })).toBeInTheDocument();
    }
    const device = within(dialog.getByRole('group', { name: 'what device are you on?' }));
    for (const name of ['iPhone', 'Android', 'iPad', 'Laptop or desktop']) {
      expect(device.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(dialog.getByRole('textbox', { name: 'Feedback message' })).toHaveAttribute('placeholder', 'Feedback...');
    expect(dialog.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('enables Send once a category, a device and a message are filled in', async () => {
    const { user } = renderModal();
    await fillIn(user);
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('sends the trimmed message, closes and thanks the user', async () => {
    vi.mocked(service.submitFeedback).mockResolvedValue();
    const { user, onClose } = renderModal();
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(service.submitFeedback).toHaveBeenCalledTimes(1);
    expect(service.submitFeedback).toHaveBeenCalledWith({ category: 'bug', device: 'desktop', message: 'Map is slow' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Thanks for the feedback!')).toBeInTheDocument();
    expect(screen.getByText('Your feedback is very important to us.')).toBeInTheDocument();
  });

  it('says Sending… while the request is in flight', async () => {
    vi.mocked(service.submitFeedback).mockReturnValue(new Promise(() => {}));
    const { user } = renderModal();
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('button', { name: 'Sending…' })).toBeDisabled();
  });

  it('keeps the message and explains when sending fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.submitFeedback).mockRejectedValue(new Error('network down'));
    const { user, onClose } = renderModal();
    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Could not send feedback')).toBeInTheDocument();
    expect(screen.getByText('Please check your connection and try again.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Feedback message' })).toHaveValue('  Map is slow  ');
  });
});
