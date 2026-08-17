import { X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const FEEDBACK_CATEGORIES = ['Report a bug', 'Feature request', 'Suggest a new study spot', 'Other'];

interface FeedbackModalProps {
  onClose: () => void;
}

const FeedbackModal = ({ onClose }: FeedbackModalProps) => {
  useEscapeKey(onClose);

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <div
        className="animate-in fade-in zoom-in-95 w-[90vw] max-w-xl rounded-2xl bg-white p-6 shadow-xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h2 id="feedback-title" className="text-xl font-semibold text-gray-900">
            Feedback
          </h2>
          <button
            aria-label="Close"
            className="-mt-1 -mr-1 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">Please provide feedback on how I can improve UBSeats.</p>
        <div className="mt-3">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">what is your suggestion?</h3>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_CATEGORIES.map((category) => (
              <span
                key={category}
                className="rounded-full border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <form className="grid gap-2">
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Feedback..."
            />
            <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
