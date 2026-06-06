import { ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cnUtils';

interface ViewSpaceButtonProps {
  link?: string;
  className?: string;
}

/** Opens a room's booking/info link in a new tab. Renders nothing without a link. */
export const ViewSpaceButton = ({ link, className }: ViewSpaceButtonProps) => {
  if (!link) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.open(link, '_blank');
      }}
      className={cn(
        'ml-4 flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-md active:bg-blue-800',
        className,
      )}
    >
      View Space
      <ExternalLink className="ml-2 h-4 w-4" />
    </button>
  );
};
