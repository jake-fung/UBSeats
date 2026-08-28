import { useMemo, useRef } from 'react';
import { BlockStatus, TimeSlot, computeDayBlocks, formatTime } from '@/utils/hoursUtils';
import { cn } from '@/utils/cnUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface RoomTimetableProps {
  slots?: TimeSlot[];
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

export const RoomTimetable = ({ slots }: RoomTimetableProps) => {
  const now = useMemo(() => new Date(), []);
  const blocks = useMemo(() => computeDayBlocks(slots, now), [slots, now]);
  const visibleBlocks = useMemo(() => {
    const filtered = blocks.filter((block) => block.end > now);
    if (filtered.every((block) => block.status === 'closed')) {
      return [];
    }
    return filtered;
  }, [blocks, now]);
  const currentBlockRef = useRef<HTMLDivElement>(null);

  if (visibleBlocks.length === 0) {
    return null;
  }

  return (
    <div className="no-scrollbar w-full overflow-x-scroll p-1">
      <div className="relative">
        <div className="flex gap-px">
          {visibleBlocks.map((block, i) => (
            <Tooltip key={block.start.toISOString()} delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  ref={i === 0 ? currentBlockRef : undefined}
                  className={cn('h-6 w-3 shrink-0 rounded-[2px]', STATUS_CLASSES[block.status])}
                />
              </TooltipTrigger>
              <TooltipContent className={cn(block.title && 'max-w-56 rounded-2xl px-3 py-1.5 text-center')}>
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
