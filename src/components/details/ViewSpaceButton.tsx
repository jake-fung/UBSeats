import { ExternalLink } from 'lucide-react';

interface ViewSpaceButtonProps {
  link?: string;
  bookable?: boolean;
}

/** Opens a room's booking/info link in a new tab. Renders nothing without a link. */
export const ViewSpaceButton = ({ link, bookable }: ViewSpaceButtonProps) => {
  if (!link) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.open(link, '_blank');
      }}
      className="my-auto ml-2 flex min-w-[100px] items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-md active:bg-blue-800"
    >
      {bookable ? 'Reserve' : 'View'}
      <ExternalLink className="ml-2 h-4 w-4" />
    </button>
  );
};
