import { Building } from '@/utils/types';
import { ArrowLeft, MapPin, X, Users, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
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
      <button
        onClick={() => {
          setIsMenuOpened?.(!isMenuOpened);
        }}
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

            {/* Image Gallery */}
            {building?.image && (
              <div className="relative rounded-xl bg-gray-900">
                <img src={building?.image} alt={building?.name} className="h-full w-full rounded-xl object-cover" />
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 pb-20">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Spaces</h3>
              </div>
              {building?.rooms?.map((room) => (
                <div
                  key={room.uuid}
                  className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="mb-3 sm:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Users className="mr-1.5 h-4 w-4" />
                      <span>Capacity: {room.capacity}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      window.open(room.link, '_blank');
                    }}
                    className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                  >
                    View Space
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
