import { Building } from '@/utils/types';
import { ArrowLeft, MapPin, X } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { useEffect } from 'react';

export interface BuildingDetailProps {
  building?: Building;
  isMenuOpened: boolean;
  setIsMenuOpened: (isMenuOpened: boolean) => void;
}

export const BuildingDetail = ({ building, isMenuOpened, setIsMenuOpened }: BuildingDetailProps) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpened?.(false);
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <section
      className={cn(
        'fixed bottom-0 right-0 z-20 h-full w-[40%] translate-x-full rounded-l-3xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-lg transition-transform duration-300',
        isMenuOpened && 'translate-x-0',
      )}
    >
      <div className="relative h-full">
        <button
          onClick={() => {
            setIsMenuOpened?.(!isMenuOpened);
          }}
          className="absolute -left-10 top-1/2 z-20 flex h-20 w-10 -translate-y-1/2 items-center justify-center rounded-l-2xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-lg"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="p-6">
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <span
                key={building?.uuid}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: '#007bff', color: 'white' }}
              >
                {building?.code}
              </span>
            </div>

            <h2 className="mb-1 text-2xl font-bold text-gray-900">{building?.name}</h2>

            <div className="mb-2 flex items-center text-sm text-gray-600">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
              <span>{building?.primaryAddress}</span>
            </div>

            {/* list all rooms in this building in card style */}
            {building?.rooms?.map((room) => (
              <div key={room.uuid} className="mb-2">
                <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
