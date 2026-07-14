import { useMemo, useRef, type RefObject } from 'react';
import { MapPin } from 'lucide-react';
import { Building } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';
import { getBuildingStatus } from '@/utils/hoursUtils';
import { HoursPill } from '@/components/details/HoursPill';
import { LibraryCard } from '@/components/details/LibraryCard';
import { RoomSection } from '@/components/details/RoomSection';
import { useScrolled } from '@/hooks/useScrolled';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { BodyDragProps } from '@/hooks/useSheetDrag';

/**
 * The two hosts differ only in a few cosmetic classes (corner rounding, top
 * padding, and the shadow/background applied once scrolled). Everything else —
 * the scroll container, sticky header, image, library, cafés, and spaces — is
 * identical, so it lives here as the single source of truth.
 */
type Variant = 'panel' | 'sheet';

const VARIANTS: Record<Variant, { scroll: string; header: string; scrolled: string }> = {
  panel: {
    scroll: 'relative mb-4 px-6',
    header: 'rounded-tl-3xl pt-6',
    scrolled: 'bg-white/40 shadow-lg shadow-gray-500/60 backdrop-blur-md',
  },
  sheet: {
    scroll: 'px-6 pb-8',
    header: 'rounded-t-3xl pt-4',
    scrolled: 'bg-white/60 shadow-lg shadow-gray-500/40 backdrop-blur-md',
  },
};

interface BuildingDetailContentProps {
  building?: Building;
  isOpen: boolean;
  onClose: () => void;
  variant: Variant;
  /** Sheet variant only: shared scroll container ref so the drag hook can read scrollTop. */
  scrollRef?: RefObject<HTMLDivElement>;
  /** Sheet variant only: true at the half detent, where the body drags instead of scrolling. */
  scrollLocked?: boolean;
  /** Sheet variant only: pointer handlers that let the whole body drag the sheet. */
  bodyDragProps?: BodyDragProps;
}

export const BuildingDetailContent = ({
  building,
  isOpen,
  onClose,
  variant,
  scrollRef,
  scrollLocked,
  bodyDragProps,
}: BuildingDetailContentProps) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const contentRef = scrollRef ?? internalRef; // sheet shares its ref with the drag hook; panel owns its own
  const scrolled = useScrolled(contentRef, isOpen);
  useEscapeKey(onClose);

  const v = VARIANTS[variant];

  // The desktop panel always scrolls. The mobile sheet locks scrolling at the half detent
  // (the body drags instead) and only scrolls — with overscroll contained — once expanded.
  const overflowClass =
    variant === 'sheet'
      ? scrollLocked
        ? 'touch-none overflow-hidden'
        : 'touch-pan-y overflow-y-auto overscroll-contain'
      : 'overflow-y-auto';

  const status = useMemo(() => (building ? getBuildingStatus(building.hours) : null), [building]);

  return (
    <div className={cn('no-scrollbar h-full', overflowClass, v.scroll)} ref={contentRef} {...bodyDragProps}>
      <div
        className={cn(
          'sticky top-0 z-10 -mx-6 px-6 pb-2 transition-all duration-200',
          v.header,
          scrolled && v.scrolled,
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
          <img
            src={building.image}
            alt={building.name}
            className="h-full w-full rounded-xl object-cover"
            loading="lazy"
          />
        </div>
      )}

      {building?.library && building.library.rooms.length > 0 && <LibraryCard library={building.library} />}

      <div className="my-4 flex flex-col gap-3">
        <RoomSection rooms={building?.rooms || []} heading="Spaces" />
      </div>
    </div>
  );
};
