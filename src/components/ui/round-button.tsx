import * as React from 'react';

import { cn } from '@/utils/cnUtils';

interface RoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  /** Toggle state; leave undefined for a plain action button (no aria-pressed). */
  pressed?: boolean;
}

/** Floating round control over the map (favourites, locate, day picker). */
const RoundButton = React.forwardRef<HTMLButtonElement, RoundButtonProps>(
  ({ label, pressed, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        'flex items-center gap-2 rounded-full p-3 shadow-lg',
        pressed ? 'bg-primary text-white' : 'bg-white text-gray-700',
        className,
      )}
      {...props}
    />
  ),
);
RoundButton.displayName = 'RoundButton';

export { RoundButton, type RoundButtonProps };
