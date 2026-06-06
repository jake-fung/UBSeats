import { useRef } from 'react';
import { Building } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';
import { DragHandle } from '@/components/DragHandle';
import { useSheetDrag } from '@/hooks/useSheetDrag';
import { BuildingDetailContent } from '@/components/detail/BuildingDetailContent';

export interface BottomSheetProps {
  building?: Building;
  isOpen: boolean;
  onClose: () => void;
}

export const BottomSheet = ({ building, isOpen, onClose }: BottomSheetProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { heightClass, style, isDragging, scrollLocked, dragHandleProps, bodyDragProps } = useSheetDrag({
    isOpen,
    onClose,
    scrollRef,
  });

  return (
    <section
      className={cn(
        'fixed bottom-0 left-0 z-20 w-full rounded-t-3xl bg-white/80 shadow-2xl shadow-gray-600 backdrop-blur-sm',
        isDragging ? 'transition-none' : 'transition-[transform,height] duration-300 ease-out',
        isOpen ? 'translate-y-0' : 'translate-y-full',
        heightClass,
      )}
      style={isOpen ? style : undefined}
    >
      <DragHandle
        className={cn('absolute right-1/2 translate-x-1/2', isOpen ? '-translate-y-6' : '-translate-y-0')}
        {...dragHandleProps}
      />

      <BuildingDetailContent
        building={building}
        isOpen={isOpen}
        onClose={onClose}
        variant="sheet"
        scrollRef={scrollRef}
        scrollLocked={scrollLocked}
        bodyDragProps={bodyDragProps}
      />
    </section>
  );
};
