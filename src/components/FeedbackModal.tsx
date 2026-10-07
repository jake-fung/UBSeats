import { useState, type FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/supabase/services/supabaseService';
import type { FeedbackCategory, FeedbackDevice } from '@/supabase/schema';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const MESSAGE_MAX_LENGTH = 2000;

const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Report a bug' },
  { value: 'feature', label: 'Request a new feature' },
  { value: 'spot', label: 'Suggest a new study spot' },
  { value: 'other', label: 'Other' },
];

const FEEDBACK_DEVICES: { value: FeedbackDevice; label: string }[] = [
  { value: 'iphone', label: 'iPhone' },
  { value: 'android', label: 'Android' },
  { value: 'ipad', label: 'iPad' },
  { value: 'desktop', label: 'Laptop or desktop' },
];

interface FeedbackModalProps {
  onClose: () => void;
}

const FeedbackModal = ({ onClose }: FeedbackModalProps) => {
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [device, setDevice] = useState<FeedbackDevice | ''>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  /** Keep the dialog open while a submission is in flight (Esc and outside clicks are ignored). */
  const holdWhileSubmitting = (e: Event) => {
    if (submitting) e.preventDefault();
  };

  const canSubmit = category !== '' && device !== '' && message.trim().length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (category === '' || device === '' || submitting) return;

    const trimmed = message.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await submitFeedback({ category, device, message: trimmed });
      onClose();
      toast({
        title: 'Thanks for the feedback!',
        description: 'Your feedback is very important to us.',
        duration: 4000,
      });
    } catch (err) {
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
    <DialogContent
      className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto overscroll-contain"
      onEscapeKeyDown={holdWhileSubmitting}
      onInteractOutside={holdWhileSubmitting}
    >
      <DialogTitle className="mb-3 pr-8 text-xl font-semibold text-gray-900">Feedback</DialogTitle>

      <DialogDescription className="text-sm leading-relaxed text-gray-600">
        Please provide feedback on how I can improve UBSeats.
      </DialogDescription>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <fieldset className="mt-3">
          <legend className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
            what is your suggestion?
          </legend>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_CATEGORIES.map((option) => (
              <Chip
                key={option.value}
                tone="outline"
                pressed={category === option.value}
                onClick={() => setCategory(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
            what device are you on?
          </legend>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_DEVICES.map((option) => (
              <Chip
                key={option.value}
                tone="outline"
                pressed={device === option.value}
                onClick={() => setDevice(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-2">
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Feedback..."
            rows={4}
            maxLength={MESSAGE_MAX_LENGTH}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="Feedback message"
          />
          <Button type="submit" variant="outline" disabled={!canSubmit}>
            {submitting ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default FeedbackModal;
