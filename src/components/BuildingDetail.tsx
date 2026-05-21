import { Building, Room } from '@/supabase/schema/types';
import { ArrowLeft, MapPin } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useEffect, useMemo } from 'react';
import { RoomCard } from '@/components/RoomCard';

const BOOKABLE_CATEGORY = 'bookable' as const;

const isBookable = (room: Room) => room.categoryIds?.includes(BOOKABLE_CATEGORY) ?? false;

export interface BuildingDetailProps {
  building?: Building;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

interface RoomSectionProps {
  rooms: Room[];
  heading: string;
  actionLabel: string;
}

const RoomSection = ({ rooms, heading, actionLabel }: RoomSectionProps) => {
  if (rooms.length === 0) return null;
  return (
    <>
      <div className="flex items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {heading} ({rooms.length})
        </h3>
      </div>
      {rooms.map((room) => (
        <RoomCard key={room.uuid} room={room} actionLabel={actionLabel} />
      ))}
    </>
  );
};

export const BuildingDetail = ({ building, isOpen, onClose, onToggle }: BuildingDetailProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const bookableRooms = useMemo(() => building?.rooms?.filter(isBookable) ?? [], [building]);
  const otherRooms = useMemo(() => building?.rooms?.filter((room) => !isBookable(room)) ?? [], [building]);

  return (
    <section
      className={cn(
        'fixed bottom-0 right-0 z-20 h-full w-[40%] translate-x-full rounded-l-3xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-lg transition-transform duration-300',
        isOpen && 'translate-x-0',
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'absolute -left-10 top-1/2 z-20 flex h-20 w-10 -translate-y-1/2 items-center justify-center rounded-l-2xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-lg',
          !building && 'hidden',
        )}
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="relative h-full overflow-y-scroll">
        <div className="p-6">
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                {building?.code}
              </span>
            </div>
            <h2 className="mb-1 text-2xl font-bold text-gray-900">{building?.name}</h2>
            <div className="mb-2 flex items-center text-sm text-gray-600">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
              <span>{building?.primaryAddress}</span>
            </div>
            {building?.image && (
              <div className="relative rounded-xl bg-gray-900">
                <img src={building.image} alt={building.name} className="h-full w-full rounded-xl object-cover" />
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <RoomSection rooms={bookableRooms} heading="Bookable Spaces" actionLabel="Book Space" />
              <RoomSection rooms={otherRooms} heading="Spaces" actionLabel="View Space" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
