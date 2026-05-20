import { Building, Room } from '@/supabase/schema/types';
import { ArrowLeft, MapPin, Users, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useEffect } from 'react';

const BOOKABLE_CATEGORY = 'bookable' as const;

const isBookable = (room: Room) => room.categoryIds?.includes(BOOKABLE_CATEGORY) ?? false;

export interface BuildingDetailProps {
  building?: Building;
  isMenuOpened: boolean;
  setIsMenuOpened: (isMenuOpened: boolean) => void;
}

interface RoomCardProps {
  room: Room;
  actionLabel: string;
}

const RoomCard = ({ room, actionLabel }: RoomCardProps) => (
  <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
    <div className="mb-3 sm:mb-0">
      <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
      <div className="mt-1 flex items-center text-sm text-gray-500">
        <Users className="mr-1.5 h-4 w-4" />
        <span>Capacity: {room.capacity}</span>
      </div>
    </div>
    {room.link && (
      <button
        onClick={() => window.open(room.link, '_blank')}
        className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        {actionLabel}
        <ExternalLink className="ml-2 h-4 w-4" />
      </button>
    )}
  </div>
);

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

export const BuildingDetail = ({ building, isMenuOpened, setIsMenuOpened }: BuildingDetailProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpened(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsMenuOpened]);

  const bookableRooms = building?.rooms?.filter(isBookable) ?? [];
  const otherRooms = building?.rooms?.filter((room) => !isBookable(room)) ?? [];

  return (
    <section
      className={cn(
        'fixed bottom-0 right-0 z-20 h-full w-[40%] translate-x-full rounded-l-3xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-lg transition-transform duration-300',
        isMenuOpened && 'translate-x-0',
      )}
    >
      <button
        onClick={() => setIsMenuOpened(!isMenuOpened)}
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
