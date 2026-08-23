import { X } from 'lucide-react';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/supabase/services/supabaseService';
import type { FeedbackCategory, FeedbackDevice } from '@/supabase/schema/types';

/** Mirrors the `char_length(message) between 1 and 2000` CHECK on `public.feedback`. */
const MESSAGE_MAX_LENGTH = 2000;

/**
 * Chips store slugs and render labels. Rewording a label must never change what
 * lands in the database — the CHECK constraint is pinned to these slugs.
 */
const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Report a bug' },
  { value: 'feature', label: 'Feature request' },
  { value: 'spot', label: 'Suggest a new study spot' },
  { value: 'other', label: 'Other' },
];

const FEEDBACK_DEVICES: { value: FeedbackDevice; label: string }[] = [
  { value: 'iphone', label: 'iPhone' },
  { value: 'android', label: 'Android' },
  { value: 'ipad', label: 'iPad' },
  { value: 'desktop', label: 'Laptop or desktop' },
];

const chipClass = (selected: boolean) =>
  [
    'rounded-full border px-3 py-2 text-xs transition-colors',
    'focus:ring-2 focus:ring-[#0055B7] focus:ring-offset-1 focus:outline-none',
    selected
      ? 'border-[#0055B7] bg-[#0055B7] text-white'
      : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
  ].join(' ');

interface FeedbackModalProps {
  onClose: () => void;
}

const FeedbackModal = ({ onClose }: FeedbackModalProps) => {
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [device, setDevice] = useState<FeedbackDevice | ''>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const pressStartedOnBackdrop = useRef(false);

  // Dismissing mid-submit would unmount the modal and discard the typed
  // message before the error path can keep it around, so both the backdrop
  // click and Escape are gated on `!submitting` below.
  const handleEscape = useCallback(() => {
    if (!submitting) onClose();
  }, [submitting, onClose]);

  useEscapeKey(handleEscape);

  // Postgres CHECK constraints are the real validation boundary; this only spares
  // the user a round trip. `submitting` in the guard is the double-submit guard.
  const canSubmit = category !== '' && device !== '' && message.trim().length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (category === '' || device === '' || submitting) return;

    const trimmed = message.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await submitFeedback({ category, device, message: trimmed });
      // Unmounting discards the form state, so there is nothing to reset here.
      onClose();
      toast({
        title: 'Thanks for the feedback!',
        description: 'Your feedback is very important to us.',
        duration: 4000,
      });
    } catch (err) {
      // Keep the modal open with the typed message intact — losing someone's
      // feedback to a network blip is the one failure that actually costs us.
      console.error('feedback submission failed:', err);
      toast({
        title: 'Could not send feedback',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200 animate-in fade-in"
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (!submitting && pressStartedOnBackdrop.current && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-[90vw] max-w-xl overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-xl duration-200 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h2 id="feedback-title" className="text-xl font-semibold text-gray-900">
            Feedback
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="-mt-1 -mr-1 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-gray-600">Please provide feedback on how I can improve UBSeats.</p>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <fieldset className="mt-3">
            <legend className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              what is your suggestion?
            </legend>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CATEGORIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={category === option.value}
                  className={chipClass(category === option.value)}
                  onClick={() => setCategory(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              what device are you on?
            </legend>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_DEVICES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={device === option.value}
                  className={chipClass(device === option.value)}
                  onClick={() => setDevice(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Feedback..."
              rows={4}
              maxLength={MESSAGE_MAX_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-label="Feedback message"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
