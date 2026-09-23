import { useMemo, useRef, useState } from 'react';
import { BlockStatus, DayBlock, TimeSlot, computeDayBlocks, formatTime } from '@/utils/hoursUtils';
import { isSameLocalDay } from '@/utils/dateUtils';
import { cn } from '@/utils/cnUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface RoomTimetableProps {
  slots?: TimeSlot[];
  date: Date;
}

const STATUS_CLASSES: Record<BlockStatus, string> = {
  available: 'bg-green-400',
  unavailable: 'bg-red-400',
  closed: 'bg-gray-300',
};

const STATUS_LABELS: Record<BlockStatus, string> = {
  available: 'Available',
  unavailable: 'Unavailable',
  closed: 'Closed',
};

function blockTime(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return formatTime(`${hh}:${mm}`);
}

/**
 * A future day has no "now" to start from, so show it from first to last open block.
 * Interior closed blocks (e.g. a lunch closure) stay visible as grey.
 */
function trimClosedEnds(blocks: DayBlock[]): DayBlock[] {
  let first = 0;
  while (first < blocks.length && blocks[first].status === 'closed') first++;
  let last = blocks.length - 1;
  while (last >= first && blocks[last].status === 'closed') last--;
  return blocks.slice(first, last + 1);
}

export const RoomTimetable = ({ slots, date }: RoomTimetableProps) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // `date` is referentially stable per day, so this re-reads the clock when the day
  // changes (e.g. today rolls over at midnight) and otherwise keeps a stable "now".
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `date` is the re-read trigger, not an input
  const now = useMemo(() => new Date(), [date]);
  const isToday = isSameLocalDay(date, now);
  const blocks = useMemo(() => computeDayBlocks(slots, date), [slots, date]);
  const visibleBlocks = useMemo(() => {
    if (!isToday) return trimClosedEnds(blocks);
    const filtered = blocks.filter((block) => block.end > now);
    if (filtered.every((block) => block.status === 'closed')) {
      return [];
    }
    return filtered;
  }, [blocks, now, isToday]);
  const currentBlockRef = useRef<HTMLDivElement>(null);

  if (visibleBlocks.length === 0) {
    // Today keeps its old behaviour (nothing left to show → hide). A future day with data
    // but no open block is a real closure, which is worth saying rather than vanishing.
    return isToday ? null : <p className="px-1 pt-1 text-xs text-gray-500">Closed all day</p>;
  }

  return (
    <div className="no-scrollbar w-full overflow-x-scroll p-1">
      <div className="relative">
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
                  ref={i === 0 ? currentBlockRef : undefined}
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
                <div>{`${blockTime(block.start)}–${blockTime(block.end)} · ${STATUS_LABELS[block.status]}`}</div>
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
              {block.start.getMinutes() === 0 ? blockTime(block.start) : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
