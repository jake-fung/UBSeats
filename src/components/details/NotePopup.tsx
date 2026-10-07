import type { RefObject } from 'react';
import { Note } from '@/supabase/schema';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface NotePopupProps {
  note: Note | null;
  onClose: () => void;
  /** The note button that opened the popup; focus returns there on close (no DialogTrigger here). */
  returnFocusRef: RefObject<HTMLElement | null>;
}

/** Full-screen explainer for a room note; tap anywhere or press Esc to dismiss. */
export const NotePopup = ({ note, onClose, returnFocusRef }: NotePopupProps) => (
  <Dialog open={note !== null} onOpenChange={(open) => !open && onClose()}>
    {note && (
      <DialogContent
        hideClose
        overlayClassName="bg-black/40 backdrop-blur-md"
        className="flex h-full max-h-none w-full max-w-none flex-col items-center justify-center rounded-none bg-transparent p-8 shadow-none"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocusRef.current?.focus();
        }}
        onClick={(e) => {
          // Portal events still bubble through the React tree; keep them off the card underneath.
          e.stopPropagation();
          onClose();
        }}
      >
        <div
          className="mb-6 rounded-full px-5 py-2 text-center text-xl font-semibold text-white shadow-lg"
          style={{ backgroundColor: note.color ?? '#6B7280' }}
          aria-hidden="true"
        >
          {note.name}
        </div>

        <div className="max-w-md rounded-2xl bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xs">
          <DialogTitle className="mb-3 text-2xl font-bold text-gray-900">{note.name}</DialogTitle>
          <DialogDescription className="text-gray-500">{note.description}</DialogDescription>
        </div>

        <p className="mt-6 text-sm text-white/80">Tap anywhere or press Esc to close</p>
      </DialogContent>
    )}
  </Dialog>
);
