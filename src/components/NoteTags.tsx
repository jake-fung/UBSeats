import { Note } from '@/supabase/schema/types';
import { useState } from 'react';
import { NotePopup } from '@/components/NotePopup';

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
        <span
          key={note.id}
          className="inline-flex cursor-pointer items-center justify-between gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white transition-transform hover:-translate-y-0.5 hover:scale-105 hover:shadow-md active:scale-100"
          style={{ backgroundColor: note.color ?? '#6B7280' }}
          onClick={(e) => {
            e.stopPropagation();
            openNote(note);
          }}
        >
          {note.name}
        </span>
      ))}

      <NotePopup note={activeNote} isVisible={isNoteVisible} onClose={closeNote} />
    </>
  );
};
