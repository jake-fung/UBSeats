import { createPortal } from 'react-dom';
import { Note } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';

interface NotePopupProps {
  note: Note | null;
  isVisible: boolean;
  onClose: () => void;
}

export const NotePopup = ({ note, isVisible, onClose }: NotePopupProps) => {
  if (!note) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center p-8 transition-all duration-200',
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      >
        <div
          className="mb-6 rounded-full px-5 py-2 text-center text-xl font-semibold text-white shadow-lg"
          style={{ backgroundColor: note.color ?? '#6B7280' }}
        >
          {note.name}
        </div>

        <div className="max-w-md rounded-2xl bg-white/90 p-8 text-center shadow-2xl backdrop-blur-sm">
          <h2 className="mb-3 text-2xl font-bold text-gray-900">{note.name}</h2>
          <p className="text-gray-500">{note.description}</p>
        </div>

        <p className="mt-6 text-sm text-white/60">Click anywhere to close</p>
      </div>
    </div>,
    document.body,
  );
};
