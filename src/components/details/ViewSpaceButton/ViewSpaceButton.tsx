import { ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/utils/cnUtils';

interface ViewSpaceButtonProps {
  link?: string;
  bookable?: boolean;
}

export const ViewSpaceButton = ({ link, bookable }: ViewSpaceButtonProps) => {
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(buttonVariants(), 'my-auto ml-2 min-w-[100px] motion-safe:hover:scale-105')}
    >
      {bookable ? 'Reserve' : 'View'}
      <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
      <span className="sr-only">(opens in new tab)</span>
    </a>
  );
};
