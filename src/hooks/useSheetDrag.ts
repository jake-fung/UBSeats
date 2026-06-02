import { useEffect, useState, type CSSProperties } from 'react';
import type { DragHandleProps } from '@/components/DragHandle';

/** Open positions the sheet can rest at, as fractions of the viewport height. */
const HALF_VH = 0.5; // mirrors the `h-[50vh]` class returned below
const FULL_VH = 0.85; // mirrors the `h-[85vh]` class returned below

/** Drag distances (as a fraction of the viewport) needed to cross between detents. */
const SNAP = {
  expand: 0.1, // drag up this far from half → snap to full
  collapse: 0.15, // drag down this far from full → snap back to half
  dismiss: 0.2, // drag down this far from half → close
};

type Detent = 'half' | 'full';

export interface UseSheetDragOptions {
  /** Whether the sheet is open; closing resets the detent back to half. */
  isOpen: boolean;
  /** Called when a downward drag from the half detent passes the dismiss threshold. */
  onClose: () => void;
}

export interface UseSheetDragResult {
  /** Tailwind height class for the sheet's current resting detent. */
  heightClass: string;
  /** Inline style to apply to the sheet while dragging (height or transform); undefined at rest. */
  style: CSSProperties | undefined;
  /** True mid-gesture, so the parent can disable its snap transition. */
  isDragging: boolean;
  /** Gesture callbacks to spread onto <DragHandle>. */
  dragHandleProps: Pick<DragHandleProps, 'onDragStart' | 'onDragMove' | 'onDragEnd'>;
}

/**
 * Derives the live inline style for an in-progress drag: grow or shrink the sheet
 * height when moving between detents, or translate it down when pulling the half
 * sheet toward dismissal. `vh` is the viewport height in px. Kept pure (no DOM
 * read) so the snap geometry can be reasoned about and tested in isolation.
 */
const computeDragStyle = (detent: Detent, dragOffset: number, vh: number): CSSProperties => {
  const base = (detent === 'full' ? FULL_VH : HALF_VH) * vh;
  if (dragOffset < 0) {
    return { height: `${Math.min(FULL_VH * vh, base - dragOffset)}px` }; // pulling up → grow toward full
  }
  if (detent === 'full') {
    return { height: `${Math.max(HALF_VH * vh, base - dragOffset)}px` }; // pulling down → shrink toward half
  }
  return { transform: `translateY(${dragOffset}px)` }; // pulling down from half → follow finger toward dismissal
};

/**
 * Turns the handle's raw drag gesture into bottom-sheet behaviour: a two-detent
 * sheet (half ↔ full) that dismisses when pulled down far enough from half. It
 * owns the detent/offset state and derives the live style the sheet should wear
 * while dragging; the consumer applies that style/class to the element it renders.
 */
export const useSheetDrag = ({ isOpen, onClose }: UseSheetDragOptions): UseSheetDragResult => {
  const [detent, setDetent] = useState<Detent>('half'); // resting open position
  const [dragOffset, setDragOffset] = useState(0); // signed px during an active drag (negative = up)
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
      setDetent('half'); // reopen at the half detent every time
    }
  }, [isOpen]);

  const onDragStart = () => setIsDragging(true);
  const onDragMove = (offset: number) => setDragOffset(offset);

  const onDragEnd = (offset: number) => {
    const vh = window.innerHeight;
    if (detent === 'half') {
      if (offset < -vh * SNAP.expand) setDetent('full'); // pulled up → expand
      else if (offset > vh * SNAP.dismiss) onClose(); // pulled down far → dismiss
    } else if (offset > vh * SNAP.collapse) {
      setDetent('half'); // pulled down from full → collapse one notch
    }
    setDragOffset(0); // hand the resting position back to the class + transition
    setIsDragging(false);
  };

  return {
    heightClass: isOpen && detent === 'full' ? 'h-[85vh]' : 'h-[50vh]',
    style: isDragging ? computeDragStyle(detent, dragOffset, window.innerHeight) : undefined,
    isDragging,
    dragHandleProps: { onDragStart, onDragMove, onDragEnd },
  };
};
