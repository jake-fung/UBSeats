import { Building } from '@/supabase/schema/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import { BuildingDetailContent } from '@/components/details/BuildingDetailContent';

export interface SidePanelProps {
  building?: Building;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const SidePanel = ({ building, isOpen, onClose, onToggle }: SidePanelProps) => {
  return (
    <section
      className={cn(
        'fixed right-0 bottom-0 z-20 h-full w-[50%] translate-x-full rounded-l-3xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-xs transition-transform duration-300',
        isOpen && 'translate-x-0',
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'absolute top-1/2 -left-10 z-20 flex h-20 w-10 -translate-y-1/2 items-center justify-center rounded-l-2xl bg-white/60 shadow-2xl shadow-gray-600 backdrop-blur-lg',
          !building && 'hidden',
        )}
      >
        {isOpen ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
      </button>

      <BuildingDetailContent building={building} isOpen={isOpen} onClose={onClose} variant="panel" />
    </section>
  );
};
