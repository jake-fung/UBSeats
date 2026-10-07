import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/utils/cnUtils';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed: boolean;
  /** `filled` floats over the map (filter bar); `outline` sits in forms (feedback). */
  tone: 'filled' | 'outline';
  icon?: LucideIcon;
}

const TONES = {
  filled: {
    base: 'gap-1.5 px-3 py-1.5 text-sm font-medium shadow-xs duration-200 ease-out motion-safe:active:scale-95',
    rest: 'bg-white text-gray-700 hover:bg-gray-100',
    pressed: 'bg-primary text-white shadow-md',
  },
  outline: {
    base: 'border px-3 py-2 text-xs',
    rest: 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
    pressed: 'border-primary bg-primary text-white',
  },
} as const;

const Chip = ({ pressed, tone, icon: Icon, className, children, type = 'button', ...props }: ChipProps) => {
  const t = TONES[tone];
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn('flex shrink-0 items-center rounded-full transition-all', t.base, pressed ? t.pressed : t.rest, className)}
      {...props}
    >
      {Icon && <Icon className={cn('h-3.5 w-3.5', pressed ? 'text-white' : 'text-gray-500')} aria-hidden="true" />}
      {children}
    </button>
  );
};

export { Chip, type ChipProps };
