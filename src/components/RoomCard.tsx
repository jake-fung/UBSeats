import { Note, Room } from '@/supabase/schema/types';
import { Users, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { NotePopup } from '@/components/NotePopup';

export interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
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

  return (
    <>
      <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <div className="flex flex-wrap items-center gap-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
            {room.notes?.map((note) => (
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
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Users className="mr-1.5 h-4 w-4" />
            <span>Capacity: {room.capacity}</span>
          </div>
        </div>
        {room.link && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(room.link, '_blank');
            }}
            className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-md active:bg-blue-800"
          >
            View Space
            <ExternalLink className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>

      <NotePopup note={activeNote} isVisible={isNoteVisible} onClose={closeNote} />
    </>
  );
};
