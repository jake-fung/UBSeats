import { Note } from '@/supabase/schema/types';
import { useState } from 'react';
import { NotePopup } from '@/components/details/NotePopup';
import { InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface NoteTagsProps {
  notes?: Note[];
}

export const NoteTags = ({ notes }: NoteTagsProps) => {
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isNoteVisible, setIsNoteVisible] = useState(false);

  const openNote = (note: Note) => {
    setActiveNote(note);
    requestAnimationFrame(() => setIsNoteVisible(true));
  };

  const closeNote = () => {
    setIsNoteVisible(false);
    setTimeout(() => setActiveNote(null), 200);
  };

  if (!notes || notes.length === 0) return null;

  return (
    <>
      {notes.map((note) => (
        <Tooltip key={note.id} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={note.name}
              className="inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 transition-transform"
              style={{ color: note.color ?? '#6B7280' }}
              onClick={(e) => {
                e.stopPropagation();
                openNote(note);
              }}
            >
              <InfoIcon className="h-4 w-4 flex-shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{note.name}</TooltipContent>
        </Tooltip>
      ))}

      <NotePopup note={activeNote} isVisible={isNoteVisible} onClose={closeNote} />
    </>
  );
};
