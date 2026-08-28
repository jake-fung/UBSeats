import { Note } from '@/supabase/schema/types';
import { useState } from 'react';
import { NotePopup } from '@/components/details/NotePopup';
import { Apple, AppWindow, Cable, CalendarClock, ConciergeBell, InfoIcon, Monitor, Briefcase, CalendarRange, GraduationCap, Projector, Scale } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ICON_MAP = {
  Apple,
  AppWindow,
  Cable,
  CalendarRange,
  GraduationCap,
  ConciergeBell,
  Scale,
  Briefcase,
  Projector,
  CalendarClock,
  Monitor,
  InfoIcon,
} as const;

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
      {notes.map((note) => {
        const Icon = ICON_MAP[note.icon as keyof typeof ICON_MAP] ?? InfoIcon;

        return (
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
                <Icon className="h-4 w-4 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{note.name}</TooltipContent>
          </Tooltip>
        );
      })}

      <NotePopup note={activeNote} isVisible={isNoteVisible} onClose={closeNote} />
    </>
  );
};
