import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BlockStatus, TimeSlot, computeDayBlocks, formatClockTime, summarizeDayBlocks } from '@/utils/hoursUtils';
import { isSameLocalDay } from '@/utils/dateUtils';
import { cn } from '@/utils/cnUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface RoomTimetableProps {
  slots?: TimeSlot[];
  date: Date;
}

// Available vs booked differ in lightness and pattern (hatching), not hue alone; closed is hollow.
const STATUS_CLASSES: Record<BlockStatus, string> = {
  available: 'bg-slot-available',
  unavailable: 'slot-booked',
  closed: 'border border-slot-closed bg-transparent',
};

const STATUS_LABELS: Record<BlockStatus, string> = {
  available: 'Available',
  unavailable: 'Unavailable',
  closed: 'Closed',
};

export const RoomTimetable = ({ slots, date }: RoomTimetableProps) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const now = useMemo(() => new Date(), [date]);
  const isToday = isSameLocalDay(date, now);
  const blocks = useMemo(() => computeDayBlocks(slots, date), [slots, date]);
  const visibleBlocks = useMemo(() => {
    const filtered = isToday ? blocks.filter((block) => block.end > now) : blocks;
    if (filtered.every((block) => block.status === 'closed')) {
      return [];
    }
    return filtered;
  }, [blocks, now, isToday]);
  const summary = useMemo(() => summarizeDayBlocks(visibleBlocks), [visibleBlocks]);
  const firstOpenIndex = isToday ? 0 : visibleBlocks.findIndex((block) => block.status !== 'closed');
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstOpenRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const block = firstOpenRef.current;
    if (container && block) container.scrollLeft = block.offsetLeft;
  }, [date, firstOpenIndex]);

  if (visibleBlocks.length === 0) {
    return isToday ? null : <p className="px-1 pt-1 text-xs text-gray-500">Closed all day</p>;
  }

  return (
    <div ref={scrollRef} className="no-scrollbar w-full overflow-x-scroll p-1">
      {summary && <p className="sr-only">{summary}</p>}
      <div className="relative" aria-hidden="true">
        <div className="flex gap-px">
          {visibleBlocks.map((block, i) => (
            <Tooltip
              key={block.start.toISOString()}
              delayDuration={0}
              open={openId === block.start.toISOString()}
              onOpenChange={(open) => {
                if (isMobile) return;
                setOpenId(open ? block.start.toISOString() : null);
              }}
            >
              <TooltipTrigger asChild>
                <div
                  ref={i === firstOpenIndex ? firstOpenRef : undefined}
                  data-timetable-block=""
                  className={cn('h-6 w-3 shrink-0 rounded-[2px]', STATUS_CLASSES[block.status])}
                  onClick={(e) => {
                    if (!isMobile) return;
                    e.stopPropagation();
                    setOpenId(openId === block.start.toISOString() ? null : block.start.toISOString());
                  }}
                />
              </TooltipTrigger>
              <TooltipContent
                className={cn(block.title && 'max-w-56 rounded-2xl px-3 py-1.5 text-center')}
                onPointerDownOutside={(e) => {
                  const target = (e.detail.originalEvent.target as Element | null) ?? null;
                  if (target?.closest('[data-timetable-block]')) return;
                  setOpenId(null);
                }}
                onEscapeKeyDown={() => setOpenId(null)}
              >
                <div>{`${formatClockTime(block.start)}–${formatClockTime(block.end)} · ${STATUS_LABELS[block.status]}`}</div>
                {block.title && <div className="text-muted-foreground">{block.title}</div>}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex gap-px">
          {visibleBlocks.map((block) => (
            <div
              key={`label-${block.start.toISOString()}`}
              className="w-3 shrink-0 text-[9px] leading-tight whitespace-nowrap text-gray-500"
            >
              {block.start.getMinutes() === 0 ? formatClockTime(block.start) : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
