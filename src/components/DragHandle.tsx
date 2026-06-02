import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/utils/cnUtils';

export interface DragHandleProps {
  /** Fired when a drag begins (pointer down on the handle). */
  onDragStart?: () => void;
  /** Live signed offset in px from where the drag began; negative = dragged up. */
  onDragMove?: (offset: number) => void;
  /** Final signed offset in px when the pointer is released; 0 when the gesture is cancelled. */
  onDragEnd?: (offset: number) => void;
  className?: string;
}

/**
 * A grab bar that reports a vertical drag gesture. It owns only the pointer
 * bookkeeping and stays policy-free: it reports a signed offset (up or down) and
 * lets the caller (typically the `useSheetDrag` hook) decide what the drag means.
 */
export const DragHandle = ({ onDragStart, onDragMove, onDragEnd, className }: DragHandleProps) => {
  const dragStartRef = useRef<number | null>(null); // pointer Y captured when the drag began

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartRef.current = e.clientY;
    onDragStart?.();
    e.currentTarget.setPointerCapture(e.pointerId); // keep getting moves even if the finger slides off the handle
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return; // not an active drag → ignore stray moves
    onDragMove?.(e.clientY - dragStartRef.current); // signed: negative up, positive down
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
    onDragEnd?.(0); // aborted gesture → 0 keeps the parent at its current detent
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={cn('z-10 flex cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing', className)}
    >
      <div className="h-1.5 w-12 rounded-full bg-gray-300" />
    </div>
  );
};
