import { useEffect, useMemo, useRef } from 'react';
import { DayHours } from '@/supabase/schema/types';
import { BlockStatus, TimeSlot, computeDayBlocks, formatTime } from '@/utils/hoursUtils';
import { cn } from '@/utils/cnUtils';

export interface RoomTimetableProps {
  hours: DayHours[];
  slots?: TimeSlot[];
  expanded: boolean;
}

const STATUS_CLASSES: Record<BlockStatus, string> = {
  available: 'bg-green-400',
  unavailable: 'bg-red-400',
  closed: 'bg-gray-200',
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

export const RoomTimetable = ({ hours, slots, expanded }: RoomTimetableProps) => {
  const now = useMemo(() => new Date(), []);
  const blocks = useMemo(() => computeDayBlocks(hours, slots, now), [hours, slots, now]);
  const currentIndex = Math.floor((now.getHours() * 60 + now.getMinutes()) / 15);
  const currentBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    currentBlockRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [expanded]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="no-scrollbar flex gap-px overflow-x-auto rounded-md bg-gray-100 p-1"
    >
      {blocks.map((block, i) => (
        <div
          key={block.start.toISOString()}
          ref={i === currentIndex ? currentBlockRef : undefined}
          title={`${blockTime(block.start)}–${blockTime(block.end)} · ${STATUS_LABELS[block.status]}`}
          className={cn('h-6 w-3 shrink-0 rounded-[2px]', STATUS_CLASSES[block.status])}
        />
      ))}
    </div>
  );
};
