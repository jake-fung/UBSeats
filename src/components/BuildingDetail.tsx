import { Building, Room } from '@/supabase/schema/types';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RoomCard } from '@/components/RoomCard';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/HoursPill';
import { LibraryCard } from '@/components/LibraryCard';

export interface BuildingDetailProps {
  building?: Building;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

interface RoomSectionProps {
  rooms: Room[];
  heading: string;
}

const RoomSection = ({ rooms, heading }: RoomSectionProps) => {
  if (rooms.length === 0) return null;
  return (
    <>
      <div className="flex items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {heading} ({rooms.length})
        </h3>
      </div>
      {rooms.map((room) => (
        <RoomCard key={room.uuid} room={room} />
      ))}
    </>
  );
};

export const BuildingDetail = ({ building, isOpen, onClose, onToggle }: BuildingDetailProps) => {
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = contentRef.current?.scrollTop || 0;
      setScrolled(scrollY > 10);
    };
    contentRef.current?.addEventListener('scroll', handleScroll);
    return () => contentRef.current?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  const status = useMemo(() => (building ? getBuildingStatus(building.hours) : null), [building]);

  return (
    <section
      className={cn(
        'fixed bottom-0 right-0 z-20 h-full w-[50%] translate-x-full rounded-l-3xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-sm transition-transform duration-300',
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
        {isOpen ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
      </button>

      <div className="relative mb-4 h-full overflow-y-auto px-6" ref={contentRef}>
        <div
          className={cn(
            'sticky top-0 z-10 -mx-6 rounded-tl-3xl px-6 pb-2 pt-6 transition-all duration-200',
            scrolled && 'bg-white/40 shadow-lg shadow-gray-500/60 backdrop-blur-md',
          )}
        >
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
          {status && building?.hours && <HoursPill status={status} hours={building.hours} />}
        </div>
        {building?.image && (
          <div className="relative mt-2 rounded-xl bg-gray-900">
            <img src={building.image} alt={building.name} className="h-full w-full rounded-xl object-cover" />
          </div>
        )}
        {building?.library && building.library.rooms.length > 0 && <LibraryCard library={building.library} />}
        <div className="mt-4 flex flex-col gap-3">
          <RoomSection rooms={building?.rooms ?? []} heading="Spaces" />
        </div>
      </div>
    </section>
  );
};
