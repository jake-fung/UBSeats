import { Building, Room } from '@/supabase/schema/types';
import { MapPin, X } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RoomCard } from '@/components/RoomCard';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/HoursPill';
import { LibraryCard } from '@/components/LibraryCard';

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

export interface BottomSheetProps {
  building?: Building;
  isOpen: boolean;
  onClose: () => void;
}

export const BottomSheet = ({ building, isOpen, onClose }: BottomSheetProps) => {
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
      setScrolled(false);
    }
  }, [isOpen]);

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
        'fixed bottom-0 left-0 z-20 w-full overflow-hidden rounded-t-3xl bg-white/80 shadow-2xl shadow-gray-600 backdrop-blur-sm transition-transform duration-300',
        isOpen ? 'h-[90vh] translate-y-0' : 'translate-y-full',
      )}
    >
      {/* Drag handle
      <div className="z-10 flex justify-center pb-1 pt-3">
        <div className="h-1 w-10 rounded-full bg-gray-300" />
      </div> */}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Scrollable content */}
      <div className="no-scrollbar h-full overflow-y-auto px-6 pb-8" ref={contentRef}>
        <div
          className={cn(
            'sticky top-0 z-10 -mx-6 px-6 pb-2 pt-4 transition-all duration-200',
            scrolled && 'bg-white/60 shadow-lg shadow-gray-500/40 backdrop-blur-md',
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
