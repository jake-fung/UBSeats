import { useMemo, useRef } from 'react';
import { BlockStatus, TimeSlot, computeDayBlocks, formatTime } from '@/utils/hoursUtils';
import { cn } from '@/utils/cnUtils';

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
  console.log(blocks)
  const currentIndex = Math.floor((now.getHours() * 60 + now.getMinutes()) / 15);
  const currentBlockRef = useRef<HTMLDivElement>(null);
  const nowOffsetPercent = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;

  return (
    <div className="no-scrollbar mt-2 overflow-x-scroll p-1">
      <div className="relative w-fit">
        <div
          className="absolute top-0 bottom-0 z-10 w-0.5 -translate-x-1/2 bg-red-500"
          style={{ left: `${nowOffsetPercent}%` }}
          title={`Now · ${blockTime(now)}`}
        />
        <div className="flex gap-px">
          {blocks.map((block, i) => (
            <div
              key={block.start.toISOString()}
              ref={i === currentIndex ? currentBlockRef : undefined}
              title={`${blockTime(block.start)}–${blockTime(block.end)} · ${STATUS_LABELS[block.status]}`}
              className={cn('h-6 w-3 shrink-0 rounded-[2px]', STATUS_CLASSES[block.status])}
            />
          ))}
        </div>
        <div className="flex gap-px">
          {blocks.map((block, i) => (
            <div
              key={`label-${block.start.toISOString()}`}
              className="w-3 shrink-0 whitespace-nowrap text-[9px] leading-tight text-gray-500"
            >
              {i % 4 === 0 ? blockTime(block.start) : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
