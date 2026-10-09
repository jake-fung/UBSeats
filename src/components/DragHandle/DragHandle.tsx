import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/utils/cnUtils';

export interface DragHandleProps {
  onDragStart?: () => void;
  onDragMove?: (offset: number) => void;
  onDragEnd?: (offset: number) => void;
  className?: string;
}

export const DragHandle = ({ onDragStart, onDragMove, onDragEnd, className }: DragHandleProps) => {
  const dragStartRef = useRef<number | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartRef.current = e.clientY;
    onDragStart?.();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    onDragMove?.(e.clientY - dragStartRef.current);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    const offset = e.clientY - dragStartRef.current;
    dragStartRef.current = null;
    onDragEnd?.(offset);
  };

  const handlePointerCancel = () => {
    if (dragStartRef.current === null) return;
    dragStartRef.current = null;
    onDragEnd?.(0);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={cn('z-10 flex cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing', className)}
    >
      <div className="h-1.5 w-36 rounded-full bg-gray-300" />
    </div>
  );
};
