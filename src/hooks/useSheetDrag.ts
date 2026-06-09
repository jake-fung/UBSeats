import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import type { DragHandleProps } from '@/components/DragHandle';

/** Open positions the sheet can rest at, as fractions of the viewport height. */
const HALF_VH = 0.5; // mirrors the `h-[50vh]` class returned below
const FULL_VH = 1; // mirrors the `h-[95vh]` class returned below

/** Drag distances (as a fraction of the viewport) needed to cross between detents. */
const SNAP = {
  expand: 0.1, // drag up this far from half → snap to full
  collapse: 0.15, // drag down this far from full → snap back to half
  dismiss: 0.2, // drag down this far from half → close
};

/** Pointer travel (px) a body gesture must clear before it commits to dragging vs. native scroll. */
const DRAG_THRESHOLD = 8;

type Detent = 'half' | 'full';
/** Whether an in-progress body gesture is dragging the sheet, deferring to native scroll, or undecided. */
type BodyMode = 'idle' | 'undecided' | 'drag' | 'scroll';

export interface UseSheetDragOptions {
  /** Whether the sheet is open; closing resets the detent back to half. */
  isOpen: boolean;
  /** Called when a downward drag from the half detent passes the dismiss threshold. */
  onClose: () => void;
  /** The sheet's inner scroll container; lets a body gesture read scrollTop to choose drag vs. scroll. */
  scrollRef: RefObject<HTMLElement>;
}

/** Pointer handlers spread onto the sheet's scroll container so the whole body can drag the sheet. */
export interface BodyDragProps {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
}

export interface UseSheetDragResult {
  /** Tailwind height class for the sheet's current resting detent. */
  heightClass: string;
  /** Inline style to apply to the sheet while dragging (height or transform); undefined at rest. */
  style: CSSProperties | undefined;
  /** True mid-gesture, so the parent can disable its snap transition. */
  isDragging: boolean;
  /** True while the body must not scroll (the half detent), so the consumer can lock overflow. */
  scrollLocked: boolean;
  /** Gesture callbacks to spread onto <DragHandle>. */
  dragHandleProps: Pick<DragHandleProps, 'onDragStart' | 'onDragMove' | 'onDragEnd'>;
  /** Gesture callbacks to spread onto the sheet's scroll container so the body drags the sheet. */
  bodyDragProps: BodyDragProps;
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
export const useSheetDrag = ({ isOpen, onClose, scrollRef }: UseSheetDragOptions): UseSheetDragResult => {
  const [detent, setDetent] = useState<Detent>('half'); // resting open position
  const [dragOffset, setDragOffset] = useState(0); // signed px during an active drag (negative = up)
  const [isDragging, setIsDragging] = useState(false);

  // Body-gesture bookkeeping (refs so they survive the re-renders onDragMove triggers).
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const modeRef = useRef<BodyMode>('idle');
  const detentRef = useRef(detent); // mirror for the once-attached native touch listener below
  detentRef.current = detent;

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
      setDetent('half'); // reopen at the half detent every time
    }
  }, [isOpen]);

  // At `full`, `touch-action: pan-y` lets the browser claim a downward swipe as a scroll
  // before onBodyPointerMove can decide to drag — it fires pointercancel and the collapse
  // never starts. A non-passive touchmove (React's is passive, so preventDefault would be a
  // no-op) cancels the native scroll only in the one corner where we hijack: full detent,
  // content at the top, pulling down. overscroll-behavior:contain keeps it cancelable there.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (detentRef.current !== 'full' || el.scrollTop > 0) return; // native scroll owns it
      if (e.touches[0].clientY - startYRef.current <= 0) return; // pulling up → let it scroll
      e.preventDefault(); // pulling down at the top → keep the pointer drag alive to collapse
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [scrollRef]);

  const onDragStart = () => setIsDragging(true);
  const onDragMove = (offset: number) => setDragOffset(offset);

  const onDragEnd = (offset: number) => {
    const vh = window.innerHeight;
    if (detent === 'half') {
      if (offset < -vh * SNAP.expand)
        setDetent('full'); // pulled up → expand
      else if (offset > vh * SNAP.dismiss) onClose(); // pulled down far → dismiss
    } else if (offset > vh * SNAP.collapse) {
      setDetent('half'); // pulled down from full → collapse one notch
    }
    setDragOffset(0); // hand the resting position back to the class + transition
    setIsDragging(false);
  };

  // React's touch-class pointer listeners are passive, so we can't preventDefault native
  // scroll. Instead we only hijack a downward swipe once the content is already at the top
  // (nothing left to scroll), then flip the container to overflow:hidden so the rest of the
  // gesture drives the sheet alone. Restored on release.
  const releaseScrollLock = () => {
    if (scrollRef.current) scrollRef.current.style.overflow = '';
  };

  const onBodyPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    modeRef.current = 'undecided';
    startYRef.current = e.clientY;
    startXRef.current = e.clientX;
  };

  const onBodyPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (modeRef.current === 'idle' || modeRef.current === 'scroll') return; // not our gesture
    const dy = e.clientY - startYRef.current; // signed: negative up, positive down
    const dx = e.clientX - startXRef.current;

    if (modeRef.current === 'undecided') {
      if (Math.abs(dy) < DRAG_THRESHOLD) return; // wait for a clear vertical intent
      const atTop = (scrollRef.current?.scrollTop ?? 0) <= 0;
      // Half: any vertical swipe drags. Full: only a downward swipe while scrolled to the
      // top collapses; everything else (and horizontal-dominant gestures) is native scroll.
      const shouldDrag = Math.abs(dy) > Math.abs(dx) && (detent === 'half' || (dy > 0 && atTop));
      if (!shouldDrag) {
        modeRef.current = 'scroll';
        return;
      }
      modeRef.current = 'drag';
      e.currentTarget.setPointerCapture(e.pointerId);
      if (detent === 'full' && scrollRef.current) scrollRef.current.style.overflow = 'hidden';
      onDragStart(); // flip transition-none on before the first height mutation below
    }

    onDragMove(dy);
  };

  const onBodyPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    if (modeRef.current === 'drag') {
      onDragEnd(e.clientY - startYRef.current);
      releaseScrollLock();
    }
    modeRef.current = 'idle';
  };

  const onBodyPointerCancel = () => {
    if (modeRef.current === 'drag') {
      onDragEnd(0); // aborted gesture → keep the current detent
      releaseScrollLock();
    }
    modeRef.current = 'idle';
  };

  return {
    heightClass: isOpen && detent === 'full' ? 'h-[100vh] rounded-none' : 'h-[50vh]',
    style: isDragging ? computeDragStyle(detent, dragOffset, window.innerHeight) : undefined,
    isDragging,
    scrollLocked: detent !== 'full',
    dragHandleProps: { onDragStart, onDragMove, onDragEnd },
    bodyDragProps: {
      onPointerDown: onBodyPointerDown,
      onPointerMove: onBodyPointerMove,
      onPointerUp: onBodyPointerUp,
      onPointerCancel: onBodyPointerCancel,
    },
  };
};
